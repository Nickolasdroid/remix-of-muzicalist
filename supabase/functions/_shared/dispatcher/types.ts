// Shared dispatcher types. Every provider — email, SMS, push, in-app,
// webhook — implements the same `send(payload)` contract and returns the
// standardized DeliveryResult. Adding a new provider (SendGrid, SES, Twilio,
// Firebase, OneSignal, …) requires no changes to the dispatcher or the
// pipeline: just implement the interface and register it in the map.

export type CommunicationChannel =
  | "email"
  | "sms"
  | "push"
  | "in_app"
  | "webhook";

export interface Recipient {
  id?: string | null;
  email?: string | null;
  phone?: string | null;
  device_token?: string | null;
  user_id?: string | null;
  webhook_url?: string | null;
  locale?: string | null;
  name?: string | null;
}

/**
 * Channel-agnostic payload produced by the Communication Pipeline. Every
 * provider consumes the same shape; unused fields are simply ignored.
 */
export interface CommunicationPayload {
  channel: CommunicationChannel;
  subject: string;
  html: string;
  text: string;
  warnings?: unknown[];
  validation_errors?: unknown[];
  metadata?: Record<string, unknown>;
}

export type DeliveryStatus =
  | "sent"
  | "queued"
  | "failed"
  | "skipped"
  | "not_implemented";

export interface DeliveryResult {
  success: boolean;
  provider: string;
  message_id: string | null;
  status: DeliveryStatus;
  error: string | null;
  metadata: Record<string, unknown>;
}

export interface CommunicationProvider {
  readonly name: string;
  readonly channel: CommunicationChannel;
  send(input: {
    recipient: Recipient;
    payload: CommunicationPayload;
  }): Promise<DeliveryResult>;
}

export function notImplementedResult(
  provider: string,
  channel: CommunicationChannel,
): DeliveryResult {
  return {
    success: false,
    provider,
    message_id: null,
    status: "not_implemented",
    error: `${channel} provider "${provider}" is not implemented yet.`,
    metadata: { channel },
  };
}
