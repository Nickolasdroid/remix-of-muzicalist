import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CommunicationDispatcher,
} from "../../../supabase/functions/_shared/dispatcher/index.ts";
import { ResendEmailProvider } from "../../../supabase/functions/_shared/dispatcher/providers/email.ts";
import { NoopSmsProvider } from "../../../supabase/functions/_shared/dispatcher/providers/placeholders.ts";
import type {
  CommunicationPayload,
} from "../../../supabase/functions/_shared/dispatcher/types.ts";

const basePayload: CommunicationPayload = {
  channel: "email",
  subject: "Hi",
  html: "<p>Hi</p>",
  text: "Hi",
};

describe("CommunicationDispatcher", () => {
  it("returns COMM_PROVIDER_UNAVAILABLE when no provider is registered", async () => {
    const d = new CommunicationDispatcher();
    const r = await d.dispatch({
      channel: "sms",
      recipient: { phone: "+40" },
      payload: { ...basePayload, channel: "sms" },
    });
    expect(r.success).toBe(false);
    expect(r.status).toBe("failed");
    expect((r.metadata as Record<string, unknown>).error_code).toBe(
      "COMM_PROVIDER_UNAVAILABLE",
    );
  });

  it("routes to the registered provider by channel", async () => {
    const d = new CommunicationDispatcher();
    d.register(new NoopSmsProvider());
    const r = await d.dispatch({
      channel: "sms",
      recipient: { phone: "+40" },
      payload: { ...basePayload, channel: "sms" },
    });
    expect(r.provider).toBe("noop-sms");
    expect(r.status).toBe("not_implemented");
  });

  it("register() replaces existing provider for the same channel", async () => {
    const d = new CommunicationDispatcher();
    d.register(new NoopSmsProvider());
    const fake = {
      name: "fake-sms",
      channel: "sms" as const,
      send: vi.fn().mockResolvedValue({
        success: true,
        provider: "fake-sms",
        message_id: "x",
        status: "sent" as const,
        error: null,
        metadata: {},
      }),
    };
    d.register(fake);
    const r = await d.dispatch({
      channel: "sms",
      recipient: {},
      payload: { ...basePayload, channel: "sms" },
    });
    expect(r.provider).toBe("fake-sms");
    expect(fake.send).toHaveBeenCalledOnce();
  });
});

describe("ResendEmailProvider", () => {
  const provider = new ResendEmailProvider({
    lovableApiKey: "lov",
    resendApiKey: "res",
  });

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fails with COMM_RECIPIENT_INVALID when email is missing", async () => {
    const r = await provider.send({
      recipient: { email: null },
      payload: basePayload,
    });
    expect(r.success).toBe(false);
    expect((r.metadata as Record<string, unknown>).error_code).toBe(
      "COMM_RECIPIENT_INVALID",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("posts to the Resend gateway with the expected headers/body", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ id: "msg_1" }),
      text: async () => "",
    });
    const r = await provider.send({
      recipient: { email: "a@b.co", name: "A" },
      payload: basePayload,
    });
    expect(r.success).toBe(true);
    expect(r.message_id).toBe("msg_1");
    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer lov");
    expect(init.headers["X-Connection-Api-Key"]).toBe("res");
    const body = JSON.parse(init.body);
    expect(body.to).toEqual(["a@b.co"]);
    expect(body.subject).toBe("Hi");
    expect(body.html).toBe("<p>Hi</p>");
  });

  it("returns COMM_DELIVERY_FAILED with http_status on non-2xx", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({}),
      text: async () => "invalid",
    });
    const r = await provider.send({
      recipient: { email: "a@b.co" },
      payload: basePayload,
    });
    expect(r.success).toBe(false);
    expect(r.error).toContain("422");
    expect((r.metadata as Record<string, unknown>).http_status).toBe(422);
    expect((r.metadata as Record<string, unknown>).error_code).toBe(
      "COMM_DELIVERY_FAILED",
    );
  });

  it("catches fetch throws and returns a failed DeliveryResult", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("network down"),
    );
    const r = await provider.send({
      recipient: { email: "a@b.co" },
      payload: basePayload,
    });
    expect(r.success).toBe(false);
    expect(r.error).toBe("network down");
    expect((r.metadata as Record<string, unknown>).error_code).toBe(
      "COMM_DELIVERY_FAILED",
    );
  });

  it("honors payload.metadata.from and reply_to overrides", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ id: "x" }),
      text: async () => "",
    });
    await provider.send({
      recipient: { email: "a@b.co" },
      payload: {
        ...basePayload,
        metadata: { from: "X <x@y.co>", reply_to: "r@y.co" },
      },
    });
    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.from).toBe("X <x@y.co>");
    expect(body.reply_to).toBe("r@y.co");
  });
});
