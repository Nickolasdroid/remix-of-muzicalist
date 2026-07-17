# Communication Dispatcher

`supabase/functions/_shared/dispatcher/index.ts`

## Purpose

Route a rendered `CommunicationPayload` to the correct concrete provider
based on its `channel`. The Dispatcher is the **only** place in the code
base that maps `channel → provider`.

## Responsibilities

- Maintain a registry of `CommunicationProvider` instances keyed by
  channel.
- Return a standardized `DeliveryResult` for every dispatch call, whether
  or not a provider is registered.
- Provide `buildDefaultDispatcher()` that wires up the current production
  set (Resend for email, no-op placeholders for SMS/push/in-app/webhook).

## Inputs

`DispatchInput`
- `channel: CommunicationChannel`
- `recipient: Recipient`
- `payload: CommunicationPayload`

## Outputs

`DeliveryResult`

| Field       | Type                                 |
| ----------- | ------------------------------------ |
| success     | `boolean`                            |
| provider    | `string` (name of the provider)      |
| message_id  | `string \| null`                     |
| status      | `sent \| queued \| failed \| skipped \| not_implemented` |
| error       | `string \| null`                     |
| metadata    | `Record<string, unknown>`            |

## Error handling

- Missing provider → `success: false`, status `failed`, error message
  aligned with `COMM_PROVIDER_UNAVAILABLE`.
- Provider throws → the provider is responsible for catching and returning
  a `failed` result; if it escapes, the caller (edge function) surfaces it
  as `COMM_DELIVERY_FAILED`.

## Extension points

- `register(provider)` — add or replace a provider at runtime.
- `buildDefaultDispatcher(opts)` — the single source of truth for
  production wiring; edit here when introducing a new provider (SendGrid,
  SES, Twilio, Firebase, OneSignal, …).
