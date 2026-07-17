# Moderation — Live Collaboration

This document describes the collaboration layer that keeps the Moderation
Center safe and efficient when multiple moderators work on the same case
simultaneously.

The layer is **presentation + realtime only**. It does not add new database
tables or server RPCs — everything is coordinated through Supabase Realtime
Presence and the existing `moderation_*` Postgres change streams.

## Table of contents

- [Presence](#presence)
- [Soft locks](#soft-locks)
- [Assignment awareness](#assignment-awareness)
- [Live updates & the "case changed" banner](#live-updates)
- [Activity feed](#activity-feed)
- [Conflict protection](#conflict-protection)
- [Presence cleanup](#presence-cleanup)
- [Realtime flow](#realtime-flow)
- [Modules](#modules)

---

## Presence

Every time a moderator opens a case, the client joins a Supabase Realtime
Presence channel named `mod-case:<case_id>`. The joining payload is a
`PresenceMeta`:

```ts
{
  user_id: string;
  name: string;
  avatar_url: string | null;
  joined_at: string;   // ISO — when this viewer *first* joined
  last_active: string; // ISO — refreshed on heartbeat
}
```

The panel header renders active viewers (excluding self) as a stack of
avatars with a "Viewing this case" caption and per-avatar name tooltips.

Presence is broadcast-only — no rows are written to Postgres — so it costs
nothing to open a case and scale is bounded by the Realtime channel, not the
database.

## Soft locks

The **earliest joiner** on the presence channel is the soft-lock holder.
When another moderator opens the same case, they see:

> This case is currently being reviewed by **{holder.name}**.

Two options are offered:

- **Continue in read-only** — dismisses the CTA but keeps every write
  disabled: quick actions, status/priority selects, and the notes composer.
- **Take over review** — asks for confirmation, then rewrites the local
  `joined_at` to the Unix epoch and re-broadcasts presence. Because the
  soft-lock resolver picks the earliest `joined_at`, the current user
  becomes the new holder and the previous holder drops to read-only on
  their next presence sync (≤25s worst case; typically instant).

The lock is intentionally **soft** — never rely on it for authorization.
Every write still passes through `ModerationService` and hits an RLS-guarded
RPC. The soft lock exists to prevent unintentional stomping, not to defend
against a malicious client.

## Assignment awareness

If `moderation_cases.assigned_moderator_id` is set and is **not** the
current user, the panel resolves that user's `stage_name` via the
`profiles` table and surfaces a persistent amber warning:

> Assigned to **Maria**. Coordinate before making changes.

The warning does not block writes — assignment ownership is a workflow
signal, not an authorization boundary — but it makes ownership impossible
to miss.

## Live updates

The panel subscribes to `moderation_cases` UPDATE events filtered by
`id=eq.<caseId>`. When a peer commits a change, the incoming
`updated_at` is compared against a `lastSeenUpdatedAt` ref:

- **No local edits in flight** — the change is silent; the details reload
  transparently after the next explicit action or refresh.
- **Local edits in flight** — a banner appears at the top of the panel:

  > This case has changed. **[Refresh] [Dismiss]**

  This prevents Realtime from stomping a half-written note or an
  in-progress action.

Timeline, notes, evidence and actions each have their own
`useRealtimeTable` subscription filtered by `case_id` and refresh
independently, so status changes from another moderator show up
immediately without a full panel reload.

## Activity feed

The Timeline tab surfaces a "Live activity" strip above the full timeline
with the three most recent events. Each row uses
`animate-in fade-in slide-in-from-left-1` and a pulsing dot so new events
draw the eye without hijacking focus. Because the underlying event stream
is the immutable `moderation_case_events` table, the feed and the full
timeline are guaranteed to agree.

## Conflict protection

Writes go through `ModerationService`, which surfaces server-side errors
as typed `ModerationError` codes. The panel's `runAction` wrapper detects
conflict-class errors (`isConflictError`) — `MOD_INVALID_TRANSITION`,
`MOD_ALREADY_ASSIGNED`, `MOD_ACTION_ALREADY_REVERSED`, `MOD_CASE_NOT_FOUND`
— and:

1. Shows a **"This case has changed"** toast instead of a raw error.
2. Reloads the case details.
3. Notifies the parent so the queue re-fetches.

Read-only mode also gates `runAction`: any attempt to write while another
moderator holds the soft lock produces a helpful toast instead of an
opaque RPC failure.

## Presence cleanup

Two mechanisms keep the viewer list honest:

1. **Server-side** — Supabase automatically emits `leave` on socket close.
2. **Client-side heartbeat** — the hook re-tracks every **25s**, and the
   `activePresences` helper filters out any presence whose `last_active`
   is older than **60s** (`PRESENCE_STALE_MS`). A slow-vanishing "ghost"
   viewer therefore disappears from every peer within one stale window,
   even if their socket died without a clean close.

A 15s ticker forces a re-render on the panel so the stale filter runs
even when no presence event fires (e.g. full network drop).

## Realtime flow

```
                     ┌────────────────────────────────────────┐
                     │ Supabase Realtime: mod-case:<case_id>  │
                     │           (Presence channel)           │
                     └────────────────────────────────────────┘
                              ▲                    ▲
              track/heartbeat │                    │ track/heartbeat
                              │                    │
         ┌────────────────────┴─────┐    ┌─────────┴────────────────┐
         │  Moderator A (holder)    │    │  Moderator B (viewer)     │
         │  useCasePresence()       │    │  useCasePresence()        │
         │  joined_at = t0          │    │  joined_at = t1 (> t0)    │
         │  isReadOnly = false      │    │  isReadOnly = true        │
         └──────────────────────────┘    └───────────────────────────┘

                     ┌────────────────────────────────────────┐
                     │ Postgres → Realtime → useRealtimeTable │
                     │  moderation_cases (UPDATE)             │
                     │  moderation_case_events (INSERT)       │
                     │  moderation_case_notes (*)             │
                     │  moderation_evidence (*)               │
                     │  moderation_actions (*)                │
                     └────────────────────────────────────────┘
                              │
                              ▼
          Panel refreshes the affected tab; if the change is on
          the case row itself and a local edit is in progress,
          the "This case has changed" banner appears instead of
          auto-reloading.
```

## Modules

| Path | Responsibility |
|------|----------------|
| `src/lib/moderation/collab.ts` | Pure helpers: presence flatten/prune, soft-lock resolution, conflict detection, initials. Fully unit-tested. |
| `src/hooks/moderation/useCasePresence.ts` | Presence channel lifecycle, heartbeat, take-over. |
| `src/components/admin/moderation/CollaborationHeader.tsx` | Presence strip, soft-lock banner, assignment warning. |
| `src/components/admin/moderation/CaseDetailsPanel.tsx` | Wires read-only mode, live update banner, activity feed, conflict-aware `runAction`. |
| `src/lib/moderation/__tests__/collab.test.ts` | 15 unit tests covering presence lifecycle, soft-lock take-over, staleness, conflict classification. |

## Extending

- **Broadcast messages** (typing indicators, "someone is drafting a note")
  can be layered onto the same `mod-case:<case_id>` channel via
  `channel.send({ type: 'broadcast', ... })` without changing this layer.
- **Cursors / selections** would follow the same pattern.
- **Hard locks** (if ever needed) should be enforced server-side in a new
  `moderation_case_locks` table with RLS — never trust the presence-based
  soft lock for authorization.
