# Moderation Center — Architecture

The Moderation Center is a **case management system** for reviewing and acting on
reports and policy violations across the platform. Every piece of moderation
activity lives on a **case**; all satellite data (reports, evidence, notes,
actions, timeline events) hangs off that case.

## Design goals

1. **Case-centric.** Every reviewable item — a reported profile, an abusive
   comment, a fraudulent ad — becomes a single moderation case with a stable
   `case_number` (e.g. `MC-2026-000123`).
2. **Extensible taxonomy.** Categories, target types, and action types live in
   lookup tables. Adding a new category or target does not require a code
   change.
3. **Auditable.** Every meaningful change appends an immutable event to the
   case timeline. Applied actions cannot be edited, only reversed.
4. **Restricted access.** Only users with the `admin` or `moderator` role can
   read or write moderation data, enforced by RLS.
5. **Deterministic status flow.** Status transitions are validated at the
   database level.

## Data model overview

```
moderation_cases ──┬── moderation_reports        (1..N)  inbound reports
                   ├── moderation_evidence       (0..N)  screenshots, URLs, snapshots
                   ├── moderation_case_notes     (0..N)  private moderator notes
                   ├── moderation_actions        (0..N)  decisions applied to targets
                   └── moderation_case_events    (0..N)  immutable audit timeline

Lookups (extensible):
  moderation_categories       — spam, harassment, fake_profile, …
  moderation_target_types     — artist, user, post, review, ad, comment, …
  moderation_action_types     — warn, hide/remove, suspend, ban, dismiss, …

Enums (Postgres):
  moderation_case_status      — open, triaged, in_review, waiting_for_response,
                                 resolved, closed, reopened
  moderation_priority         — low, medium, high, critical
  moderation_event_type       — case_created, status_changed, action_applied, …
```

See [`er-diagram.mmd`](./er-diagram.mmd) for the visual ER diagram and
[`case-lifecycle.md`](./case-lifecycle.md) for the state machine.

## Access control

- Function `public.is_moderator_or_admin(uuid)` is the single source of truth
  for moderation authorization. It is `SECURITY DEFINER`, `EXECUTE` granted
  only to `authenticated` and `service_role`.
- Every moderation table has RLS enabled with policies that gate access via
  `is_moderator_or_admin(auth.uid())`.
- Only admins may `DELETE` cases or manage lookup tables.

## Audit and immutability

- `moderation_case_events` — `UPDATE` and `DELETE` are blocked by triggers.
- `moderation_actions` — everything except the reversal fields
  (`is_reversed`, `reversed_by`, `reversed_at`, `reversal_reason`) is
  immutable, enforced by trigger.
- Case updates automatically append the appropriate timeline event
  (`status_changed`, `priority_changed`, `case_assigned`, …).
- Reports/evidence/notes/actions all fire timeline events on insert.
- Status transitions run through `moderation_validate_transition()` which
  rejects illegal moves and stamps the corresponding lifecycle timestamp
  (`triaged_at`, `first_review_at`, `resolved_at`, `closed_at`, `reopened_at`).

## Extensibility

- **New category** → `INSERT INTO moderation_categories`.
- **New target type** → `INSERT INTO moderation_target_types` (optionally
  reference a `table_name` for join hints).
- **New action** → `INSERT INTO moderation_action_types` with a `severity` and
  `is_reversible` flag.
- **New timeline event** → add value to the `moderation_event_type` enum and
  extend the relevant trigger.
- **New role** → the `user_type` enum now includes `moderator`; the access
  helper checks both `admin` and `moderator`.

## Service boundary (future)

The Moderation Center is designed to plug into existing platform services:

- `content_reports` (existing table) will forward new reports into
  `moderation_reports` and back-link the resulting case.
- The admin UI will call thin RPC helpers rather than raw table writes for
  transitions/actions (to be added when the UI is built).
- The Communications module can be used to notify targets of decisions or to
  request more info from reporters.

## What is NOT built yet

- Admin UI (list, detail, timeline).
- RPCs for `open_case`, `assign`, `transition_status`, `apply_action`.
- Ingest bridge from `content_reports` → `moderation_reports`.
- SLA timers, notification hooks, and analytics rollups.

These are intentionally left for follow-up milestones and are enumerated in
[`extension-points.md`](./extension-points.md).
