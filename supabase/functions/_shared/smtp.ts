// The one place that sends email: Muzicalist's own mailbox (Hostico) over SMTP.
// No third-party email service, no gateway.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   SMTP_HOST      mail server, e.g. glc56.hostico.ro
//   SMTP_PORT      465 (SSL). Supabase Edge Functions block ports 25 and 587.
//   SMTP_USER      the mailbox, e.g. admin@muzicalist.com
//   SMTP_PASS      that mailbox's password
//   SMTP_FROM      optional "Muzicalist <admin@muzicalist.com>". Many mail servers only accept
//                  a From address that belongs to the mailbox you log in with, so when this is
//                  set it always wins over the From a caller passes.
//   SMTP_REPLY_TO  optional default Reply-To

// @ts-ignore: `npm:` specifiers are resolved by Deno at runtime, not by the app's tsc
import nodemailer from "npm:nodemailer@6.9.16";

// Present at runtime in Deno; declared here so the app's TypeScript project (which type-checks
// the shared files through the unit tests) doesn't need the Deno typings.
declare const Deno: { env: { get(key: string): string | undefined } };

export interface MailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  /** Used only when SMTP_FROM is not set. */
  from?: string;
  replyTo?: string;
}

export interface MailResult {
  messageId: string | null;
}

type Transport = ReturnType<typeof nodemailer.createTransport>;
let transport: Transport | null = null;

function config() {
  const host = Deno.env.get("SMTP_HOST");
  const user = Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASS");
  const port = Number(Deno.env.get("SMTP_PORT") ?? "465");
  if (!host || !user || !pass || !Number.isFinite(port)) return null;
  return { host, user, pass, port };
}

/** True when the mailbox secrets are present. Callers use this to answer "email_not_configured". */
export function smtpConfigured(): boolean {
  return config() !== null;
}

function getTransport(): Transport {
  if (transport) return transport;
  const cfg = config();
  if (!cfg) throw new Error("SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS)");
  transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465, // implicit TLS on 465; other ports negotiate STARTTLS
    auth: { user: cfg.user, pass: cfg.pass },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
  return transport;
}

/** Sends one email. Throws on any failure, so callers decide how to report it. */
export async function sendMail(input: MailInput): Promise<MailResult> {
  const cfg = config();
  if (!cfg) throw new Error("SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS)");

  const from = Deno.env.get("SMTP_FROM") ?? input.from ?? `Muzicalist <${cfg.user}>`;
  const replyTo = input.replyTo ?? Deno.env.get("SMTP_REPLY_TO") ?? undefined;

  const info = await getTransport().sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    ...(input.text ? { text: input.text } : {}),
    ...(replyTo ? { replyTo } : {}),
  });
  return { messageId: (info as { messageId?: string }).messageId ?? null };
}
