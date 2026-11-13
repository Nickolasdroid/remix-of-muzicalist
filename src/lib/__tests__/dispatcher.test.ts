import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CommunicationDispatcher,
} from "../../../supabase/functions/_shared/dispatcher/index.ts";
import { SmtpEmailProvider } from "../../../supabase/functions/_shared/dispatcher/providers/email.ts";
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

describe("SmtpEmailProvider", () => {
  const okSend = () => vi.fn().mockResolvedValue({ messageId: "msg_1" });

  it("fails with COMM_RECIPIENT_INVALID when email is missing", async () => {
    const send = okSend();
    const provider = new SmtpEmailProvider({ send });
    const r = await provider.send({
      recipient: { email: null },
      payload: basePayload,
    });
    expect(r.success).toBe(false);
    expect((r.metadata as Record<string, unknown>).error_code).toBe(
      "COMM_RECIPIENT_INVALID",
    );
    expect(send).not.toHaveBeenCalled();
  });

  it("sends through the SMTP sender with the expected fields", async () => {
    const send = okSend();
    const provider = new SmtpEmailProvider({ send });
    const r = await provider.send({
      recipient: { email: "a@b.co", name: "A" },
      payload: basePayload,
    });
    expect(r.success).toBe(true);
    expect(r.provider).toBe("smtp");
    expect(r.message_id).toBe("msg_1");
    expect(send).toHaveBeenCalledOnce();
    const arg = send.mock.calls[0][0];
    expect(arg.to).toBe("a@b.co");
    expect(arg.subject).toBe("Hi");
    expect(arg.html).toBe("<p>Hi</p>");
    expect(arg.text).toBe("Hi");
    expect(arg.from).toContain("muzicalist.com");
    expect(arg.replyTo).toContain("muzicalist.com");
  });

  it("catches send failures and returns a failed DeliveryResult", async () => {
    const send = vi.fn().mockRejectedValue(new Error("connection refused"));
    const provider = new SmtpEmailProvider({ send });
    const r = await provider.send({
      recipient: { email: "a@b.co" },
      payload: basePayload,
    });
    expect(r.success).toBe(false);
    expect(r.error).toBe("connection refused");
    expect((r.metadata as Record<string, unknown>).error_code).toBe(
      "COMM_DELIVERY_FAILED",
    );
  });

  it("honors payload.metadata.from and reply_to overrides", async () => {
    const send = okSend();
    const provider = new SmtpEmailProvider({ send });
    await provider.send({
      recipient: { email: "a@b.co" },
      payload: {
        ...basePayload,
        metadata: { from: "X <x@muzicalist.com>", reply_to: "r@muzicalist.com" },
      },
    });
    const arg = send.mock.calls[0][0];
    expect(arg.from).toBe("X <x@muzicalist.com>");
    expect(arg.replyTo).toBe("r@muzicalist.com");
  });
});

describe("SmtpEmailProvider custom headers", () => {
  it("passes List-Unsubscribe headers from the payload metadata to the sender", async () => {
    let seen: Record<string, unknown> | undefined;
    const provider = new SmtpEmailProvider({
      send: async (input) => {
        seen = input as unknown as Record<string, unknown>;
        return { messageId: "m1" };
      },
    });
    const headers = { "List-Unsubscribe": "<https://example.test/u?token=x>", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" };
    const res = await provider.send({
      recipient: { email: "a@b.ro" },
      payload: { channel: "email", subject: "s", html: "<p>x</p>", text: "", metadata: { headers } },
    });
    expect(res.success).toBe(true);
    expect(seen?.headers).toEqual(headers);
  });
});
