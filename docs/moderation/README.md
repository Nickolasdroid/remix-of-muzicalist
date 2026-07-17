# Moderation Center

Case-management foundation for platform moderation.

- [Architecture](./architecture.md) — design goals, data model, access model
- [Case lifecycle](./case-lifecycle.md) — statuses, transitions, timeline events, actions
- [ER diagram](./er-diagram.mmd) — visual entity-relationship diagram
- [Extension points](./extension-points.md) — what can be added without code changes and planned follow-ups

## Tables

| Table                          | Purpose                                            |
| ------------------------------ | -------------------------------------------------- |
| `moderation_cases`             | One row per case (the aggregate root)              |
| `moderation_reports`           | Inbound reports linked to a case                   |
| `moderation_evidence`          | URLs, snapshots, and attachments                   |
| `moderation_case_notes`        | Internal moderator notes                           |
| `moderation_actions`           | Decisions applied to targets (append-only)         |
| `moderation_case_events`       | Immutable timeline / audit log                     |
| `moderation_categories`        | Lookup — extensible                                |
| `moderation_target_types`      | Lookup — extensible                                |
| `moderation_action_types`      | Lookup — extensible                                |

Access is restricted to `admin` and `moderator` roles via RLS.
