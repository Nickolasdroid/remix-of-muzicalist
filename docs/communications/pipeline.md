# Communication Pipeline

`src/lib/communicationPipeline.ts`

## Purpose

Build a channel-agnostic **Communication Payload** for a given template.
The Pipeline is the single entry point used by every caller that wants to
send a message — campaigns, transactional flows, future notifications.

## Responsibilities

1. Load the template row (`email_templates`).
2. Load its currently active version (`email_template_versions`).
3. Statically validate every `{{token}}` in subject/html/text against the
   Variable Registry.
4. Render the fields via the pure `templateRenderer`.
5. Return a `CommunicationPayload` with rendered content + metadata.
6. **Never** deliver. Delivery is the Dispatcher's job.

## Inputs

`SendCommunicationInput`

| Field       | Type                            | Notes                                    |
| ----------- | ------------------------------- | ---------------------------------------- |
| templateId  | `string`                        | Row id in `email_templates`.             |
| channel     | `CommunicationChannel`          | Passed straight through to the payload.  |
| variables   | `VariableBag` (optional)        | Values for `{{namespace.identifier}}`.   |
| registry    | `VariableDefinition[]` (opt.)   | Override the built-in registry.          |
| recipient   | `{ id, email, phone, locale }`  | Propagated as metadata for the provider. |
| context     | `Record<string, unknown>`       | Free-form debug/audit context.           |

## Outputs

`CommunicationPayload`

- `ok`, `subject`, `html`, `text`
- `warnings`, `validation_errors`
- `metadata`: `{ template, version, recipient, used_variables, missing_variables, unknown_variables, rendered_at, context }`

## Error handling

Throws `CommunicationPipelineError` with codes that map to the shared
catalog:

| Legacy code           | `CommErrorCode`                 |
| --------------------- | ------------------------------- |
| `template_not_found`  | `COMM_TEMPLATE_NOT_FOUND`       |
| `no_active_version`   | `COMM_ACTIVE_VERSION_NOT_FOUND` |
| `version_not_found`   | `COMM_VERSION_NOT_FOUND`        |

## Extension points

- **New channel** — add a value to `CommunicationChannel`, then register a
  provider in the Dispatcher. The Pipeline itself needs no changes.
- **New template source** — swap `loadTemplate` / `loadActiveVersion` for
  an alternate backend by keeping the same return shapes.
- **Alternate renderer** — supply a different `registry` argument or
  branch on `input.channel` to pre-process content (e.g. Markdown → HTML).
