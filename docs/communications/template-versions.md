# Template Version Engine

Files: `src/lib/emailTemplates.ts`, `src/lib/emailTemplateVersions.ts`,
migration-defined RPCs (`create_email_template_version`,
`publish_email_template_version`, `restore_email_template_version`).

## Purpose

Preserve an immutable history of every template edit and control which
version is currently active.

## Responsibilities

- Every edit creates a **new** version — existing rows are never mutated.
- Publish flips `email_templates.active_version_id` atomically.
- Restore of an older version creates a fresh Draft rather than
  overwriting history.
- Deleting the currently active version is blocked by a DB trigger.

## Statuses

`Draft`, `Published`, `Archived` — enforced in the DB.

## Inputs / Outputs

Operations live in `emailTemplateVersions.ts`:

| Operation                | Input                                     | Output                          |
| ------------------------ | ----------------------------------------- | ------------------------------- |
| `createVersion`          | template_id, subject, html, text          | new version row                 |
| `publishVersion`         | version_id                                | updated template.active_version |
| `restoreVersion`         | version_id                                | new Draft version               |
| `listVersions`           | template_id                               | ordered version array           |

## Extension points

- Wrap `createVersion` in a validator that runs `validateTemplateContent`
  before persisting.
- Introduce a diff view by reading two versions and comparing `html`.
- Add publishing hooks (audit log, cache invalidation) at the RPC layer.
