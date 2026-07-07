// Shared helper: send an admin notification email via the existing
// Resend connector. Fire-and-forget from callers; failures are logged
// but never break the caller's flow.
const ADMIN_EMAIL = "muzicalist01@gmail.com";
const FROM = "Muzicalist <noreply@muzicalist.com>";

function escapeHtml(v: string) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTable(rows: Array<[string, string | null | undefined]>) {
  const body = rows
    .filter(([, v]) => v !== null && v !== undefined && String(v).length > 0)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;color:#6b6b73;font-size:14px;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid #1f1f24;">${escapeHtml(
          k
        )}</td><td style="padding:8px 12px;color:#ffffff;font-size:14px;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid #1f1f24;">${escapeHtml(
          String(v)
        )}</td></tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:#111114;border:1px solid #1f1f24;border-radius:12px;overflow:hidden;">${body}</table>`;
}

function renderEmail(headline: string, rows: Array<[string, string | null | undefined]>) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#000000;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000;"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#0b0b0e;border:1px solid #1f1f24;border-radius:16px;padding:32px;">
<tr><td>
<h1 style="margin:0 0 20px 0;color:#f5b301;font-size:20px;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(headline)}</h1>
${renderTable(rows)}
</td></tr></table></td></tr></table></body></html>`;
}

export async function sendAdminNotification(opts: {
  subject: string;
  headline: string;
  rows: Array<[string, string | null | undefined]>;
}): Promise<void> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    console.warn("[adminNotify] missing credentials, skipping");
    return;
  }
  try {
    const resp = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: FROM,
        to: [ADMIN_EMAIL],
        subject: opts.subject,
        html: renderEmail(opts.headline, opts.rows),
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.error("[adminNotify] send failed", resp.status, text);
    }
  } catch (e) {
    console.error("[adminNotify] error", e);
  }
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "";
  return dt.toISOString().replace("T", " ").replace(/\..+/, " UTC");
}

export async function notifyAdminNewAccount(opts: {
  accountType: "user" | "artist";
  name: string;
  email: string;
  country?: string | null;
  createdAt?: string | null;
  specialization?: string | null;
}): Promise<void> {
  const label = opts.accountType === "artist" ? "Artist" : "User";
  const rows: Array<[string, string | null | undefined]> = [
    ["Account type", label],
    [opts.accountType === "artist" ? "Artist name" : "Name", opts.name],
    ["Email", opts.email],
    ["Country", opts.country ?? ""],
    ["Registration date", formatDate(opts.createdAt)],
  ];
  if (opts.accountType === "artist") {
    rows.push(["Specialization", opts.specialization ?? ""]);
  }
  await sendAdminNotification({
    subject: `New ${label} Registered on Muzicalist`,
    headline: `New ${label} registered`,
    rows,
  });
}

export async function notifyAdminPaidSubscription(opts: {
  accountType: "user" | "artist";
  name: string;
  email: string;
  plan: "Standard" | "Premium";
  billing: "monthly" | "yearly";
  amount: number; // in major units (e.g., 9.99)
  currency: string;
  paidAt?: string | Date | null;
}): Promise<void> {
  const label = opts.accountType === "artist" ? "Artist" : "User";
  const billingLabel = opts.billing === "yearly" ? "Annual" : "Monthly";
  const rows: Array<[string, string]> = [
    ["Account type", label],
    [opts.accountType === "artist" ? "Artist name" : "Name", opts.name],
    ["Email", opts.email],
    ["Subscription plan", opts.plan],
    ["Billing period", billingLabel],
    ["Amount paid", opts.amount.toFixed(2)],
    ["Currency", opts.currency.toUpperCase()],
    ["Payment date", formatDate(opts.paidAt ?? new Date())],
  ];
  await sendAdminNotification({
    subject: `New Paid Subscription on Muzicalist – ${opts.plan}`,
    headline: `New paid subscription (${opts.plan})`,
    rows,
  });
}
