# Case Lifecycle

## Statuses

| Status                  | Meaning                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| `open`                  | Case just created; not yet triaged.                              |
| `triaged`               | Category/priority confirmed; queued for review.                  |
| `in_review`             | Moderator is actively investigating.                             |
| `waiting_for_response`  | Awaiting reply from reporter, target user, or external party.    |
| `resolved`              | Decision made and action(s) applied.                             |
| `closed`                | Terminal state; no further work planned.                         |
| `reopened`              | A previously closed/resolved case has been reactivated.          |

## Allowed transitions

Enforced by `public.moderation_validate_transition()`:

```
open                 → triaged | in_review | closed
triaged              → in_review | waiting_for_response | closed
in_review            → waiting_for_response | resolved | closed
waiting_for_response → in_review | resolved | closed
resolved             → closed | reopened
closed               → reopened
reopened             → in_review | triaged | closed
```

Any other transition raises an exception at the database level.

## Automatic timestamps

The trigger stamps lifecycle timestamps as soon as a status is reached:

- `triaged_at` when moving to `triaged`
- `first_review_at` on first move to `in_review`
- `resolved_at` when moving to `resolved`
- `closed_at` when moving to `closed`
- `reopened_at` when moving to `reopened` (also clears `resolved_at` and `closed_at`)

## Timeline events

Every change is written to `moderation_case_events`. The event stream is
append-only — `UPDATE` and `DELETE` are blocked by triggers.

| Trigger source                          | `event_type`                                          |
| --------------------------------------- | ----------------------------------------------------- |
| Case inserted                           | `case_created`                                        |
| `status` changed                        | `status_changed` / `case_resolved` / `case_closed` / `case_reopened` |
| `priority` changed                      | `priority_changed`                                    |
| `category_id` changed                   | `category_changed`                                    |
| `assigned_moderator_id` changed         | `case_assigned` / `case_unassigned`                   |
| Report inserted                         | `report_added` (increments `reports_count`)           |
| Evidence inserted                       | `evidence_added`                                      |
| Note inserted                           | `note_added`                                          |
| Action inserted                         | `action_applied`                                      |
| Action reversed (`is_reversed` → true)  | `action_reversed`                                     |
| Reserved (used by future workflows)     | `appeal_received`, `decision_changed`, `system_note`  |

## Actions

Actions are **append-only decisions** taken by a moderator (warn, hide,
remove, suspend, ban, escalate, dismiss, …). Every action:

- References a case, an `action_type_id`, and optionally a specific target.
- Records `performed_by`, `reason`, and free-form `parameters`.
- Can be **reversed** by setting `is_reversed = true` and providing
  `reversed_by` + `reversal_reason`. All other fields are protected by an
  immutability trigger.

The `is_reversible` flag on `moderation_action_types` lets the UI hide the
reverse action for irreversible decisions such as `dismiss` and `no_action`.

## Priorities

`low`, `medium`, `high`, `critical`. Each category has a `default_priority`
used when the case is first created; moderators can override it any time
(logged as `priority_changed`).
