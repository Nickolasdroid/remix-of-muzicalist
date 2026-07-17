import {
  CommunicationPayload,
  CommunicationProvider,
  DeliveryResult,
  Recipient,
  notImplementedResult,
} from "../types.ts";

export class NoopSmsProvider implements CommunicationProvider {
  readonly name = "noop-sms";
  readonly channel = "sms" as const;
  send(_: { recipient: Recipient; payload: CommunicationPayload }): Promise<DeliveryResult> {
    return Promise.resolve(notImplementedResult(this.name, this.channel));
  }
}

export class NoopPushProvider implements CommunicationProvider {
  readonly name = "noop-push";
  readonly channel = "push" as const;
  send(_: { recipient: Recipient; payload: CommunicationPayload }): Promise<DeliveryResult> {
    return Promise.resolve(notImplementedResult(this.name, this.channel));
  }
}

export class NoopInAppProvider implements CommunicationProvider {
  readonly name = "noop-in-app";
  readonly channel = "in_app" as const;
  send(_: { recipient: Recipient; payload: CommunicationPayload }): Promise<DeliveryResult> {
    return Promise.resolve(notImplementedResult(this.name, this.channel));
  }
}

export class NoopWebhookProvider implements CommunicationProvider {
  readonly name = "noop-webhook";
  readonly channel = "webhook" as const;
  send(_: { recipient: Recipient; payload: CommunicationPayload }): Promise<DeliveryResult> {
    return Promise.resolve(notImplementedResult(this.name, this.channel));
  }
}
