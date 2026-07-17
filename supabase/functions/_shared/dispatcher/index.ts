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
import { ResendEmailProvider } from "./providers/email.ts";
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
      return {
        success: false,
        provider: "unknown",
        message_id: null,
        status: "failed",
        error: `No provider registered for channel "${input.channel}".`,
        metadata: { channel: input.channel },
      };
    }
    return provider.send({ recipient: input.recipient, payload: input.payload });
  }
}

export interface BuildOptions {
  lovableApiKey?: string;
  resendApiKey?: string;
}

/**
 * Default dispatcher wiring — Resend for email, placeholders for other
 * channels. Swap or add providers here as new integrations land.
 */
export function buildDefaultDispatcher(opts: BuildOptions = {}): CommunicationDispatcher {
  const d = new CommunicationDispatcher();
  if (opts.lovableApiKey && opts.resendApiKey) {
    d.register(
      new ResendEmailProvider({
        lovableApiKey: opts.lovableApiKey,
        resendApiKey: opts.resendApiKey,
      }),
    );
  }
  d.register(new NoopSmsProvider());
  d.register(new NoopPushProvider());
  d.register(new NoopInAppProvider());
  d.register(new NoopWebhookProvider());
  return d;
}

export * from "./types.ts";
