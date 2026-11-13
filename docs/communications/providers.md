# Providers

`supabase/functions/_shared/dispatcher/providers/*.ts`

Providers are thin adapters between the Dispatcher and a concrete
delivery backend (SMTP, Twilio, Firebase, …). Every provider implements
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
| `providers/email.ts`          | `SmtpEmailProvider`       | email    | Sends through the Muzicalist mailboxes (`_shared/smtp.ts`). |
| `providers/placeholders.ts`   | `NoopSmsProvider`         | sms      | Returns `not_implemented`.        |
| `providers/placeholders.ts`   | `NoopPushProvider`        | push     | Returns `not_implemented`.        |
| `providers/placeholders.ts`   | `NoopInAppProvider`       | in_app   | Returns `not_implemented`.        |
| `providers/placeholders.ts`   | `NoopWebhookProvider`     | webhook  | Returns `not_implemented`.        |

## SmtpEmailProvider

Delivery goes through `supabase/functions/_shared/smtp.ts` (nodemailer over SMTP, port 465).
Which mailbox sends is chosen from the From address (see the header of `smtp.ts`).

### Inputs
- `recipient.email` (**required**).
- `payload.subject`, `payload.html`, optional `payload.text`.
- `payload.metadata.from` / `payload.metadata.reply_to` overrides.

### Outputs
`DeliveryResult` with `message_id` set to the SMTP message id on success. On failure the SMTP
error message is returned in `error`.

### Error handling
- Missing recipient email → `success: false`, aligned with
  `COMM_RECIPIENT_INVALID`.
- SMTP error (connection, authentication, rejected recipient) → `success: false`,
  `COMM_DELIVERY_FAILED`.
- Network throw → caught, returned as `failed`.

## Extension points

Add a new provider by:

1. Implementing `CommunicationProvider` in a new `providers/<name>.ts`.
2. Registering it in `buildDefaultDispatcher()`.
3. Documenting inputs/outputs and error semantics in this file.

Never branch on `channel` outside the Dispatcher — add a provider instead.
