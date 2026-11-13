// Public endpoint behind the "unsubscribe" link of marketing emails.
// GET  /unsubscribe?token=...   (link click)  -> unsubscribes and shows a confirmation page
// POST /unsubscribe?token=...   (one-click, RFC 8058, sent by mail providers) -> unsubscribes
// The token is the only thing needed; it identifies one address and nothing else.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const TOKEN_RE = /^[0-9a-f]{48}$/;

const page = (title: string, message: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<title>${title}</title></head><body style="margin:0;background:#0b0b0e;color:#fff;font-family:Arial,Helvetica,sans-serif">` +
      `<div style="max-width:480px;margin:12vh auto;padding:0 24px;text-align:center">` +
      `<div style="font-size:14px;letter-spacing:3px;font-weight:700;margin-bottom:24px">MUZICALIST</div>` +
      `<h1 style="font-size:22px;margin:0 0 12px">${title}</h1>` +
      `<p style="color:#b8b8c2;line-height:1.6;margin:0 0 24px">${message}</p>` +
      `<a href="https://www.muzicalist.com" style="color:#f5b301">muzicalist.com</a></div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!TOKEN_RE.test(token)) {
    return page("Link invalid", "Linkul de dezabonare nu este valid. / This unsubscribe link is not valid.", 400);
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: row } = await admin
    .from("email_unsubscribe_tokens")
    .select("id, email")
    .eq("token", token)
    .maybeSingle();
  if (!row) {
    return page("Link invalid", "Linkul de dezabonare nu a fost găsit. / This unsubscribe link was not found.", 404);
  }

  const { error } = await admin
    .from("suppressed_emails")
    .upsert({ email: row.email, reason: "unsubscribe" }, { onConflict: "email", ignoreDuplicates: true });
  if (error) {
    console.error("unsubscribe: could not suppress", error.message);
    return page("Eroare", "Nu am putut procesa cererea acum. Încearcă din nou. / We could not process this now. Please try again.", 500);
  }
  await admin.from("email_unsubscribe_tokens").update({ used_at: new Date().toISOString() }).eq("id", row.id);

  return page(
    "Te-ai dezabonat",
    "Nu vei mai primi emailuri de la Muzicalist pe această adresă. / You will no longer receive emails from Muzicalist at this address.",
  );
});
