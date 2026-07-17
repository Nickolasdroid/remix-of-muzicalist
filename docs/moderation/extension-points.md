# Extension Points

The Moderation Center is designed to grow without schema-breaking changes.

## Add data without code changes

| Need                             | How                                                                  |
| -------------------------------- | -------------------------------------------------------------------- |
| New report category              | `INSERT INTO public.moderation_categories(key,label,default_priority,sort_order)` |
| New target type                  | `INSERT INTO public.moderation_target_types(key,label,table_name,sort_order)`     |
| New moderator action             | `INSERT INTO public.moderation_action_types(key,label,is_reversible,severity)`    |
| Disable an existing lookup value | `UPDATE ... SET is_active = false` (rows still resolve historically) |

## Requires a migration

| Need                          | Change                                                         |
| ----------------------------- | -------------------------------------------------------------- |
| New status                    | Add to `moderation_case_status` enum + update transition table |
| New timeline event type       | Add to `moderation_event_type` enum + extend logging trigger   |
| New priority tier             | Add to `moderation_priority` enum                              |
| New role beyond admin/mod     | Extend `user_type` enum + `is_moderator_or_admin` helper       |

## Planned follow-ups (not built)

1. **RPC surface**
   - `moderation_open_case(target_type, target_id, category, reporter_id, description)`
   - `moderation_assign_case(case_id, moderator_id)`
   - `moderation_transition(case_id, next_status, note?)`
   - `moderation_apply_action(case_id, action_type, parameters?, reason?)`
   - `moderation_reverse_action(action_id, reason)`
2. **Ingest bridge** from `public.content_reports` into
   `moderation_reports` with case de-duplication by `(target_type, target_id, open cases)`.
3. **Admin UI** using the Admin Platform Foundation
   (`DataTable`, `DetailsDrawer`, `RowActions`, `StatusBadge`).
4. **Notification hooks** via the Communication Pipeline
   (target notified on action, reporter notified on resolution).
5. **SLA tracking** — deadlines per priority, breach flags, dashboards.
6. **Analytics** — cases opened/closed, average time-to-resolve, action mix
   per category, moderator throughput.
7. **Appeals workflow** — dedicated table and `appeal_received` event with a
   `reopened` transition.
8. **Bulk actions** — batch-apply the same action across many targets
   (e.g. mass spam dismissal).

## Integration points already in place

- `is_moderator_or_admin(uuid)` — single authorization function for all
  future RPCs and edge functions.
- Immutable `moderation_case_events` — safe to consume from analytics or a
  future event bus.
- Lookup tables — safe to render in dropdowns without hardcoding values.
