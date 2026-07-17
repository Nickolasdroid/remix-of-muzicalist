# Providers

`supabase/functions/_shared/dispatcher/providers/*.ts`

Providers are thin adapters between the Dispatcher and a concrete
delivery backend (Resend, Twilio, Firebase, …). Every provider implements
the same interface:

```ts
interface CommunicationProvider {
  readonly name: string;
  readonly channel: CommunicationChannel;
  send(input: { recipient: Recipient; payload: CommunicationPayload }): Promise<DeliveryResult>;
}
```

## Current providers

| File                          | Class                     | Channel  | Notes                             |
| ----------------------------- | ------------------------- | -------- | --------------------------------- |
| `providers/email.ts`          | `ResendEmailProvider`     | email    | Uses the Lovable connector gateway. |
| `providers/placeholders.ts`   | `NoopSmsProvider`         | sms      | Returns `not_implemented`.        |
| `providers/placeholders.ts`   | `NoopPushProvider`        | push     | Returns `not_implemented`.        |
| `providers/placeholders.ts`   | `NoopInAppProvider`       | in_app   | Returns `not_implemented`.        |
| `providers/placeholders.ts`   | `NoopWebhookProvider`     | webhook  | Returns `not_implemented`.        |

## ResendEmailProvider

### Inputs
- `recipient.email` (**required**).
- `payload.subject`, `payload.html`, optional `payload.text`.
- `payload.metadata.from` / `payload.metadata.reply_to` overrides.

### Outputs
`DeliveryResult` with `message_id` populated from the Resend response id
on success. On HTTP failure the response body (truncated to 500 chars) is
included in `error`.

### Error handling
- Missing recipient email → `success: false`, aligned with
  `COMM_RECIPIENT_INVALID`.
- Non-2xx from Resend → `success: false`, `COMM_DELIVERY_FAILED`, with
  the provider status in `metadata.http_status`.
- Network throw → caught, returned as `failed`.

## Extension points

Add a new provider by:

1. Implementing `CommunicationProvider` in a new `providers/<name>.ts`.
2. Registering it in `buildDefaultDispatcher()`.
3. Documenting inputs/outputs and error semantics in this file.

Never branch on `channel` outside the Dispatcher — add a provider instead.
