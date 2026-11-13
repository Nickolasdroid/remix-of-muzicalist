// Communication Dispatcher.
// Single point that maps a channel → provider. No other module in the
// project should branch on channel to choose delivery: register providers
// here and consumers just call `dispatcher.dispatch(...)`.

import {
  CommunicationChannel,
  CommunicationPayload,
  CommunicationProvider,
  DeliveryResult,
  Recipient,
} from "./types.ts";
import { commError } from "./errors.ts";
import { SmtpEmailProvider } from "./providers/email.ts";
import { smtpConfigured } from "../smtp.ts";
import {
  NoopInAppProvider,
  NoopPushProvider,
  NoopSmsProvider,
  NoopWebhookProvider,
} from "./providers/placeholders.ts";

export interface DispatchInput {
  channel: CommunicationChannel;
  recipient: Recipient;
  payload: CommunicationPayload;
}

export class CommunicationDispatcher {
  private readonly providers = new Map<CommunicationChannel, CommunicationProvider>();

  register(provider: CommunicationProvider): this {
    this.providers.set(provider.channel, provider);
    return this;
  }

  getProvider(channel: CommunicationChannel): CommunicationProvider | undefined {
    return this.providers.get(channel);
  }

  async dispatch(input: DispatchInput): Promise<DeliveryResult> {
    const provider = this.providers.get(input.channel);
    if (!provider) {
      const err = commError(
        "COMM_PROVIDER_UNAVAILABLE",
        `No provider registered for channel "${input.channel}".`,
      );
      return {
        success: false,
        provider: "unknown",
        message_id: null,
        status: "failed",
        error: err.message,
        metadata: { channel: input.channel, error_code: err.code },
      };
    }
    return provider.send({ recipient: input.recipient, payload: input.payload });
  }
}

/**
 * Default dispatcher wiring — SMTP (Hostico mailbox) for email, placeholders for other
 * channels. Swap or add providers here as new integrations land.
 */
export function buildDefaultDispatcher(): CommunicationDispatcher {
  const d = new CommunicationDispatcher();
  if (smtpConfigured()) {
    d.register(new SmtpEmailProvider());
  }
  d.register(new NoopSmsProvider());
  d.register(new NoopPushProvider());
  d.register(new NoopInAppProvider());
  d.register(new NoopWebhookProvider());
  return d;
}

export * from "./types.ts";
