# Variable Engine

`src/lib/emailVariables.ts`

## Purpose

Central registry + validation service for `{{namespace.identifier}}`
tokens used across every template. UI (`EmailVariablesPanel`), the
Pipeline, and the Renderer all consult this file — no hardcoded token
lists anywhere else.

## Responsibilities

- Define the built-in registry of known variables.
- Group variables by namespace for the UI panel.
- Provide `validateTemplateContent(content)` — pure, synchronous
  extraction and validation of every token in a string.
- Provide `suggestVariables(partial)` for editor autocomplete.

## Namespaces

`user`, `artist`, `subscription`, `booking`, `system`, `campaign`.

## Inputs / Outputs

### `validateTemplateContent(content, registry?): ValidationResult`

Errors detected:

| Type        | Trigger                                                  | Catalog code            |
| ----------- | -------------------------------------------------------- | ----------------------- |
| `malformed` | Empty `{{}}`, invalid characters, unclosed braces.       | `COMM_INVALID_VARIABLE` |
| `unknown`   | Token not registered.                                    | `COMM_INVALID_VARIABLE` |
| `duplicate` | Same token used more than once (informational).          | `COMM_INVALID_VARIABLE` |

Returns `{ ok, used, unknown, duplicates, errors }`.

### `suggestVariables(partial, registry?, limit?)`

Prefix matches first, then contains. Deterministic ordering.

## Extension points

- Swap the built-in `BUILTIN` array for a DB-backed loader by populating
  the module-level `cache`. `loadVariableRegistry()` is already async so
  callers won't need changes.
- Add per-channel variables by extending `VariableNamespace`.
