# Moderation Service Layer

The Moderation Center is exposed to the rest of the app through a **single
service layer**. UI, edge functions, and future automation must call
`ModerationService` — no code path is allowed to `INSERT`, `UPDATE`, or
`DELETE` moderation tables directly.

```
UI / hooks / edge fn
        │
        ▼
ModerationService  ── validates payloads ── mapPostgresError ──►  UI toast / metrics
        │
        ▼ (Supabase RPC)
Postgres SECURITY DEFINER functions
        │
        ├── enforce moderator role  (moderation_require_mod)
        ├── validate transitions    (moderation_validate_transition)
        ├── write to case / satellite tables
        └── triggers append immutable events
                    │
                    ▼
          moderation_case_events  (append-only, read via ModerationTimelineService)
```

## Files

| File                                    | Responsibility                                           |
| --------------------------------------- | -------------------------------------------------------- |
| `src/lib/moderation/service.ts`         | `ModerationService` — public API for business ops        |
| `src/lib/moderation/timelineService.ts` | `ModerationTimelineService` — read-only timeline access  |
| `src/lib/moderation/validation.ts`      | Pure business rules, transition matrix, payload checks   |
| `src/lib/moderation/errors.ts`          | `ModerationError` + code catalog + Postgres mapping      |
| `src/lib/moderation/metrics.ts`         | Metric names, samples, and `timed()` helper              |
| `src/lib/moderation/types.ts`           | Row/enum types mirrored from the database                |
| `src/lib/moderation/index.ts`           | Barrel export                                            |

## Public API — `ModerationService`

| Method                | RPC                              | Purpose                                    |
| --------------------- | -------------------------------- | ------------------------------------------ |
| `createCase`          | `create_moderation_case`         | Open a new case + optional first report    |
| `assignModerator`     | `assign_moderator`               | Assign, auto-triage if case was `open`     |
| `unassignModerator`   | `unassign_moderator`             | Clear assignee                             |
| `changeStatus`        | `change_case_status`             | Validated status transition + optional note|
| `changePriority`      | `change_case_priority`           | Update priority                            |
| `addEvidence`         | `add_case_evidence`              | Attach URL / content / snapshot            |
| `addNote`             | `add_case_note`                  | Internal moderator note                    |
| `addAction`           | `add_case_action`                | Apply a decision (warn, ban, dismiss, …)   |
| `reverseAction`       | `reverse_case_action`            | Reverse a reversible action                |
| `closeCase`           | `close_case`                     | Terminal status + optional resolution      |
| `reopenCase`          | `reopen_case`                    | Move `resolved`/`closed` → `reopened`      |
| `getCase`             | `get_moderation_case_details`    | Case + counts snapshot                     |
| `listCases`           | `list_moderation_cases`          | Filtered / paginated list                  |
| `getTimeline`         | `get_moderation_case_timeline`   | Immutable event stream                     |

Every method returns typed rows and throws `ModerationError` with a stable
`code` (see `MODERATION_ERROR_MESSAGES`).

## Validation flow

Two layers, both authoritative in their scope:

1. **Client-side (`validation.ts`).** Pure functions with zero I/O. Enforce
   required fields, enum membership, and the transition matrix. Runs before
   the RPC to fail fast and avoid noisy round-trips.
2. **Server-side (RPC + triggers).** The last word. Re-checks role, lookup
   keys, transition legality, and immutability. Client validation MUST agree
   with the database — the transition matrix in `STATUS_TRANSITIONS` mirrors
   `moderation_validate_transition()`.

## Timeline flow

`moderation_case_events` is **append-only** and written by database triggers
only. Client and edge-function code MUST NOT insert into it — call the
appropriate service method and the trigger will emit the correct event.

| Business method             | Trigger emits                                          |
| --------------------------- | ------------------------------------------------------ |
| `createCase`                | `case_created`                                         |
| `assignModerator`           | `case_assigned` (+ `status_changed` if auto-triage)    |
| `unassignModerator`         | `case_unassigned`                                      |
| `changeStatus`              | `status_changed` / `case_resolved` / `case_closed` / `case_reopened` |
| `changePriority`            | `priority_changed`                                     |
| `addEvidence`               | `evidence_added`                                       |
| `addNote`                   | `note_added`                                           |
| `addAction`                 | `action_applied`                                       |
| `reverseAction`             | `action_reversed`                                      |
| `closeCase` / `reopenCase`  | `case_closed` / `case_reopened`                        |

Reserved-but-not-yet-emitted: `decision_changed`, `appeal_received`,
`system_note` — available for future workflows without a schema change.

## Error handling

`ModerationError` carries a `code`, human `message`, and optional `hint`.
`mapPostgresError` inspects the raised message (RPCs use
`RAISE EXCEPTION 'MOD_*'`) and produces the matching typed error. UI code
should switch on `err.code`, never string-match `err.message`.

## Metrics foundation

`metrics.ts` defines the shared metric taxonomy
(`processing_time_ms`, `case_age_ms`, `status_changes`, `actions_count`,
`notes_count`, `evidence_count`, `reports_count`). `timed()` wraps async work
to measure operation latency. A collector/analytics sink will be plugged in
during the analytics milestone; no UI is built yet.

## Extension points

- **New status** → add to `moderation_case_status` enum, extend
  `STATUS_TRANSITIONS`, extend `moderation_validate_transition()`.
- **New action** → `INSERT` into `moderation_action_types` (no code change).
- **New target** → `INSERT` into `moderation_target_types` (no code change).
- **New event type** → add to `moderation_event_type` enum, extend
  `TITLES` in `timelineService.ts`, extend the emitting trigger.
- **New RPC** → add SQL function + wrap in `ModerationService`. Keep the
  same pattern: guard → validate → mutate → let the trigger log.
- **Metrics sink** → implement a collector that consumes
  `ModerationMetricSample` and stream from a shared `emit(metric)` helper
  (to be added when analytics wiring lands).

## Tests

`src/lib/__tests__/moderationService.test.ts` covers:

- Transition matrix parity with the database
- Client-side validation for create/evidence/notes/assignment
- Error mapping catalog completeness and pass-through
- Service methods dispatching to the correct RPC with the correct args
- RPC error propagation as typed `ModerationError`
- Timeline service guard (`assertNoDirectTimelineWrites`)
- Metric sample construction and `timed()`
