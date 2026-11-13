// Unsubscribe links for marketing email. One token per address, stored in email_unsubscribe_tokens;
// the public `unsubscribe` function turns a token into a row in suppressed_emails.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

declare const Deno: { env: { get(key: string): string | undefined } };

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function unsubscribeUrl(token: string): string {
  const base = Deno.env.get("SUPABASE_URL") ?? "";
  return `${base}/functions/v1/unsubscribe?token=${token}`;
}

/** Returns the unsubscribe token of an address, creating it the first time. */
export async function getOrCreateUnsubscribeToken(admin: SupabaseClient, email: string): Promise<string> {
  const addr = email.trim().toLowerCase();
  const { data: existing } = await admin
    .from("email_unsubscribe_tokens")
    .select("token")
    .eq("email", addr)
    .limit(1)
    .maybeSingle();
  if (existing?.token) return existing.token as string;

  const token = randomToken();
  const { error } = await admin.from("email_unsubscribe_tokens").insert({ email: addr, token });
  if (error) {
    // Another run may have created it in the meantime.
    const { data: again } = await admin
      .from("email_unsubscribe_tokens")
      .select("token")
      .eq("email", addr)
      .limit(1)
      .maybeSingle();
    if (again?.token) return again.token as string;
    throw new Error(`unsubscribe token: ${error.message}`);
  }
  return token;
}
