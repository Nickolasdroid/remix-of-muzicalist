// Resend-backed EmailProvider. All Resend-specific knowledge lives here —
// the dispatcher only sees the CommunicationProvider interface.

import {
  CommunicationPayload,
  CommunicationProvider,
  DeliveryResult,
  Recipient,
} from "../types.ts";
import { commError } from "../errors.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend/emails";
const DEFAULT_FROM = "Muzicalist <contact@muzicalist.com>";
const DEFAULT_REPLY_TO = "contact@muzicalist.com";

export interface ResendEmailProviderOptions {
  lovableApiKey: string;
  resendApiKey: string;
  from?: string;
  replyTo?: string;
}

export class ResendEmailProvider implements CommunicationProvider {
  readonly name = "resend";
  readonly channel = "email" as const;

  constructor(private readonly opts: ResendEmailProviderOptions) {}

  async send(input: {
    recipient: Recipient;
    payload: CommunicationPayload;
  }): Promise<DeliveryResult> {
    const { recipient, payload } = input;
    if (!recipient.email) {
      const err = commError(
        "COMM_RECIPIENT_INVALID",
        "Recipient email is required for the email channel.",
      );
      return {
        success: false,
        provider: this.name,
        message_id: null,
        status: "failed",
        error: err.message,
        metadata: { error_code: err.code },
      };
    }

    try {
      const from =
        (payload.metadata?.["from"] as string | undefined) ??
        this.opts.from ??
        DEFAULT_FROM;
      const replyTo =
        (payload.metadata?.["reply_to"] as string | undefined) ??
        this.opts.replyTo ??
        DEFAULT_REPLY_TO;

      const resp = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.opts.lovableApiKey}`,
          "X-Connection-Api-Key": this.opts.resendApiKey,
        },
        body: JSON.stringify({
          from,
          to: [recipient.email],
          subject: payload.subject,
          reply_to: replyTo,
          html: payload.html,
          ...(payload.text ? { text: payload.text } : {}),
        }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        return {
          success: false,
          provider: this.name,
          message_id: null,
          status: "failed",
          error: `Resend ${resp.status}: ${text.slice(0, 500)}`,
          metadata: { http_status: resp.status, error_code: "COMM_DELIVERY_FAILED" },
        };
      }

      const data = (await resp.json().catch(() => ({}))) as { id?: string };
      return {
        success: true,
        provider: this.name,
        message_id: data.id ?? null,
        status: "sent",
        error: null,
        metadata: {},
      };
    } catch (err) {
      return {
        success: false,
        provider: this.name,
        message_id: null,
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
        metadata: { error_code: "COMM_DELIVERY_FAILED" },
      };
    }
  }
}
