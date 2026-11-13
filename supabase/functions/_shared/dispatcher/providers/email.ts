// SMTP-backed EmailProvider (Muzicalist's own mailbox). All delivery knowledge lives in
// ../../smtp.ts — the dispatcher only sees the CommunicationProvider interface.

import {
  CommunicationPayload,
  CommunicationProvider,
  DeliveryResult,
  Recipient,
} from "../types.ts";
import { commError } from "../errors.ts";
import { sendMail } from "../../smtp.ts";

const DEFAULT_FROM = "Muzicalist <admin@muzicalist.com>";
const DEFAULT_REPLY_TO = "admin@muzicalist.com";

export interface SmtpEmailProviderOptions {
  from?: string;
  replyTo?: string;
  /** Injected in tests; defaults to the real SMTP sender. */
  send?: typeof sendMail;
}

export class SmtpEmailProvider implements CommunicationProvider {
  readonly name = "smtp";
  readonly channel = "email" as const;

  constructor(private readonly opts: SmtpEmailProviderOptions = {}) {}

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

      const result = await (this.opts.send ?? sendMail)({
        from,
        to: recipient.email,
        subject: payload.subject,
        html: payload.html,
        ...(payload.text ? { text: payload.text } : {}),
        replyTo,
      });

      return {
        success: true,
        provider: this.name,
        message_id: result.messageId,
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
