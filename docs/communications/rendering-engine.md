# Rendering Engine

`src/lib/templateRenderer.ts`

## Purpose

Pure, dependency-free renderer that substitutes registered
`{{namespace.identifier}}` tokens across a template's subject, HTML and
text fields.

## Responsibilities

- Substitute known tokens with values from a `VariableBag`.
- HTML-escape substituted values in the `html` field (configurable).
- Never throw. Return warnings for malformed / unknown / unregistered
  tokens, and errors for missing required variables.
- Report which registered tokens were actually referenced.

## Inputs

`RenderInput`
- `subject?`, `html?`, `text?`
- `variables: VariableBag`
- `registry?` (defaults to built-in registry)
- `escapeHtmlValues?` (defaults to `true`)

## Outputs

`RenderOutput`
- Rendered `subject`, `html`, `text`
- `usedVariables`, `unknownVariables`, `missingVariables`
- `warnings`: `unknown_variable | unregistered_value | malformed_token`
- `errors`: `missing_required` (aligned with `COMM_INVALID_VARIABLE`)
- `ok`: `errors.length === 0`

## Guarantees

- Pure function — identical input yields identical output.
- No DB, no React, no Deno-only APIs. Safe to import from both browser
  and edge runtime.
- Unknown tokens are **preserved verbatim** in the output.

## Extension points

- Provide a custom `registry` to render per-tenant token sets.
- Pass `escapeHtmlValues: false` for `text/plain` pipelines.
- Wrap with `renderString()` for single-field callers (SMS body, push
  title, notification text).
