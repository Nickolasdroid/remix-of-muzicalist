// The one place that sends email: Muzicalist's own mailboxes (Hostico) over SMTP.
// No third-party email service, no gateway.
//
// Two sending mailboxes, picked by the From address a caller asks for:
//   noreply@muzicalist.com  automatic mail (welcome, suspension, admin notifications)  -> default
//   contact@muzicalist.com  mail people can answer (campaigns, legacy artists)         -> optional
//
// Secrets (Supabase -> Edge Functions -> Secrets):
//   SMTP_HOST            mail server, e.g. glc56.hostico.ro
//   SMTP_PORT            465 (SSL). Supabase Edge Functions block ports 25 and 587.
//   SMTP_USER / SMTP_PASS                the default mailbox (noreply@muzicalist.com)
//   SMTP_CONTACT_USER / SMTP_CONTACT_PASS  optional second mailbox (contact@muzicalist.com);
//                                        without it, everything is sent from the default one
//   SMTP_REPLY_TO        optional default Reply-To (falls back to contact@muzicalist.com)
//
// The From address is always the mailbox that logs in: mail servers reject a From that doesn't
// belong to the authenticated mailbox, so a caller's From address only selects which mailbox
// to use and supplies the display name.

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
  /** e.g. `Muzicalist <contact@muzicalist.com>`. Selects the mailbox; see the note above. */
  from?: string;
  replyTo?: string;
}

export interface MailResult {
  messageId: string | null;
}

type Transport = ReturnType<typeof nodemailer.createTransport>;
interface Mailbox {
  user: string;
  pass: string;
}

const DEFAULT_REPLY_TO = "contact@muzicalist.com";
const DEFAULT_NAME = "Muzicalist";
const transports = new Map<string, Transport>();

function server() {
  const host = Deno.env.get("SMTP_HOST");
  const port = Number(Deno.env.get("SMTP_PORT") ?? "465");
  if (!host || !Number.isFinite(port)) return null;
  return { host, port };
}

function mailboxes(): { primary: Mailbox | null; contact: Mailbox | null } {
  const user = Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASS");
  const cUser = Deno.env.get("SMTP_CONTACT_USER");
  const cPass = Deno.env.get("SMTP_CONTACT_PASS");
  return {
    primary: user && pass ? { user, pass } : null,
    contact: cUser && cPass ? { user: cUser, pass: cPass } : null,
  };
}

/** True when the server and the default mailbox are configured. */
export function smtpConfigured(): boolean {
  return server() !== null && mailboxes().primary !== null;
}

function parseFrom(from: string | undefined): { name: string; address: string | null } {
  if (!from) return { name: DEFAULT_NAME, address: null };
  const m = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(from);
  if (m) return { name: m[1].replace(/^"|"$/g, "") || DEFAULT_NAME, address: m[2].trim().toLowerCase() };
  return { name: DEFAULT_NAME, address: from.trim().toLowerCase() };
}

/** Picks the mailbox whose address matches the requested From; otherwise the default one. */
function pickMailbox(address: string | null): Mailbox {
  const { primary, contact } = mailboxes();
  if (!primary) throw new Error("SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS)");
  if (address && contact && contact.user.toLowerCase() === address) return contact;
  return primary;
}

function getTransport(mailbox: Mailbox): Transport {
  const srv = server();
  if (!srv) throw new Error("SMTP is not configured (SMTP_HOST, SMTP_PORT)");
  const key = `${srv.host}:${srv.port}:${mailbox.user}`;
  const existing = transports.get(key);
  if (existing) return existing;
  const created = nodemailer.createTransport({
    host: srv.host,
    port: srv.port,
    secure: srv.port === 465, // implicit TLS on 465; other ports negotiate STARTTLS
    auth: { user: mailbox.user, pass: mailbox.pass },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
  transports.set(key, created);
  return created;
}

/** Sends one email. Throws on any failure, so callers decide how to report it. */
export async function sendMail(input: MailInput): Promise<MailResult> {
  if (!smtpConfigured()) throw new Error("SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS)");

  const { name, address } = parseFrom(input.from);
  const mailbox = pickMailbox(address);
  const replyTo = input.replyTo ?? Deno.env.get("SMTP_REPLY_TO") ?? DEFAULT_REPLY_TO;

  const info = await getTransport(mailbox).sendMail({
    from: { name, address: mailbox.user },
    to: input.to,
    subject: input.subject,
    html: input.html,
    ...(input.text ? { text: input.text } : {}),
    replyTo,
  });
  return { messageId: (info as { messageId?: string }).messageId ?? null };
}
