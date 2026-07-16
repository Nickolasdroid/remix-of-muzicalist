// Supabase "Send Email" auth hook.
//
// Supabase Auth POSTs every outbound auth email (signup confirmation,
// password recovery, magic link, email change, invite, reauthentication)
// to this endpoint instead of sending it via its built-in SMTP. We verify
// the standard-webhooks signature, render a branded Muzicalist template,
// and deliver via the existing Resend connector — same FROM address and
// same connector gateway credentials as the welcome email flow.
//
// This function intentionally does NOT touch send-welcome-email or the
// admin notification path.
import { Webhook } from "npm:standardwebhooks@1.0.0";
import {
  renderAuthEmail,
  normalizeBrand,
  escapeHtml,
} from "../_shared/authEmailTemplate.ts";

const FROM = "Muzicalist <noreply@muzicalist.com>";
const SITE_URL = "https://muzicalist.com";
const SUPABASE_AUTH_URL =
  (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/+$/, "") + "/auth/v1";

interface EmailData {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type:
    | "signup"
    | "recovery"
    | "magiclink"
    | "invite"
    | "email_change"
    | "email_change_current"
    | "email_change_new"
    | "reauthentication";
  site_url: string;
  token_new?: string;
  token_hash_new?: string;
}

interface AuthUser {
  email?: string;
  new_email?: string;
  user_metadata?: Record<string, unknown>;
}

interface HookPayload {
  user: AuthUser;
  email_data: EmailData;
}

function verifyLink(emailData: EmailData, tokenHash?: string): string {
  const base = emailData.site_url?.replace(/\/+$/, "") || SUPABASE_AUTH_URL;
  const params = new URLSearchParams({
    token: tokenHash ?? emailData.token_hash,
    type: emailData.email_action_type,
    redirect_to: emailData.redirect_to || SITE_URL,
  });
  // Supabase's canonical verify URL is `${site_url}/auth/v1/verify` when the
  // site_url points at the Supabase project. When site_url is the app origin
  // we still route via the project auth URL so verification works consistently.
  const authBase = SUPABASE_AUTH_URL || `${base}/auth/v1`;
  return `${authBase}/verify?${params.toString()}`;
}

function buildEmail(user: AuthUser, emailData: EmailData): {
  subject: string;
  html: string;
  to: string;
} {
  const action = emailData.email_action_type;
  const recipient =
    action === "email_change" || action === "email_change_new"
      ? user.new_email || user.email || ""
      : user.email || "";

  const displayName = (() => {
    const meta = user.user_metadata ?? {};
    const raw =
      (meta.stage_name as string | undefined) ||
      (meta.first_name as string | undefined) ||
      (meta.full_name as string | undefined) ||
      (meta.name as string | undefined) ||
      (recipient ? recipient.split("@")[0] : "there");
    return escapeHtml(String(raw));
  })();

  switch (action) {
    case "signup": {
      const url = verifyLink(emailData);
      return {
        to: recipient,
        subject: "Confirm your Muzicalist account",
        html: renderAuthEmail({
          preview: "Confirm your email to activate your Muzicalist account.",
          headline: "Confirm your email",
          greeting: `Hi ${displayName},`,
          bodyLines: [
            "Welcome to Muzicalist.",
            "Please confirm your email address to activate your account and get started.",
          ],
          cta: { label: "Confirm my email", url },
          footnote: "This confirmation link expires in 24 hours.",
        }),
      };
    }
    case "recovery": {
      const url = verifyLink(emailData);
      return {
        to: recipient,
        subject: "Reset your Muzicalist password",
        html: renderAuthEmail({
          preview: "Reset your Muzicalist password.",
          headline: "Reset your password",
          greeting: `Hi ${displayName},`,
          bodyLines: [
            "We received a request to reset the password for your Muzicalist account.",
            "Click the button below to choose a new password. If you didn't request this, you can safely ignore this email — your password won't change.",
          ],
          cta: { label: "Reset my password", url },
          footnote: "This password reset link expires in 1 hour.",
        }),
      };
    }
    case "magiclink": {
      const url = verifyLink(emailData);
      return {
        to: recipient,
        subject: "Your Muzicalist sign-in link",
        html: renderAuthEmail({
          preview: "Sign in to your Muzicalist account.",
          headline: "Sign in to Muzicalist",
          greeting: `Hi ${displayName},`,
          bodyLines: [
            "Use the button below to sign in to your Muzicalist account.",
            "For your security, this link can only be used once.",
          ],
          cta: { label: "Sign in", url },
          footnote: "This sign-in link expires in 1 hour.",
        }),
      };
    }
    case "invite": {
      const url = verifyLink(emailData);
      return {
        to: recipient,
        subject: "You've been invited to Muzicalist",
        html: renderAuthEmail({
          preview: "Accept your invitation to Muzicalist.",
          headline: "You've been invited to Muzicalist",
          greeting: `Hi ${displayName},`,
          bodyLines: [
            "You've been invited to join Muzicalist.",
            "Accept the invitation to create your account and get started.",
          ],
          cta: { label: "Accept invitation", url },
        }),
      };
    }
    case "email_change":
    case "email_change_current":
    case "email_change_new": {
      // Supabase sends this template to BOTH the old and new address; the
      // token_hash param above verifies whichever side the user clicks.
      const url = verifyLink(
        emailData,
        action === "email_change_new"
          ? emailData.token_hash_new ?? emailData.token_hash
          : emailData.token_hash
      );
      return {
        to: recipient,
        subject: "Confirm your new Muzicalist email",
        html: renderAuthEmail({
          preview: "Confirm your new Muzicalist email address.",
          headline: "Confirm your new email",
          greeting: `Hi ${displayName},`,
          bodyLines: [
            "We received a request to change the email address on your Muzicalist account.",
            "Please confirm this change by clicking the button below. If you didn't request this, contact us right away.",
          ],
          cta: { label: "Confirm email change", url },
        }),
      };
    }
    case "reauthentication": {
      return {
        to: recipient,
        subject: "Your Muzicalist confirmation code",
        html: renderAuthEmail({
          preview: "Your Muzicalist confirmation code.",
          headline: "Confirm it's you",
          greeting: `Hi ${displayName},`,
          bodyLines: [
            "Enter the code below in Muzicalist to confirm this action.",
          ],
          otp: emailData.token,
          footnote: "This code expires in 10 minutes. Never share it with anyone.",
        }),
      };
    }
    default: {
      // Unknown action type: fall back to a plain confirm/verify link so we
      // don't drop the email silently.
      const url = verifyLink(emailData);
      return {
        to: recipient,
        subject: "Muzicalist confirmation",
        html: renderAuthEmail({
          preview: "Muzicalist confirmation.",
          headline: "Muzicalist confirmation",
          greeting: `Hi ${displayName},`,
          bodyLines: ["Please confirm this action on your Muzicalist account."],
          cta: { label: "Confirm", url },
        }),
      };
    }
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!hookSecret || !lovableApiKey || !resendApiKey) {
      console.error("auth-email-hook: missing required env");
      return new Response(
        JSON.stringify({ error: "email_not_configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const raw = await req.text();
    const headers = Object.fromEntries(req.headers);

    // Verify the Supabase-signed webhook payload. `standardwebhooks` expects
    // the secret in `v1,whsec_<base64>` form — strip the `v1,` prefix.
    const wh = new Webhook(hookSecret.replace(/^v1,/, ""));
    let payload: HookPayload;
    try {
      payload = wh.verify(raw, headers) as HookPayload;
    } catch (e) {
      console.error("auth-email-hook: signature verification failed", e);
      return new Response(JSON.stringify({ error: "invalid_signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!payload?.user || !payload?.email_data) {
      return new Response(JSON.stringify({ error: "invalid_payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { subject, html, to } = buildEmail(payload.user, payload.email_data);
    if (!to) {
      return new Response(JSON.stringify({ error: "no_recipient" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resp = await fetch(
      "https://connector-gateway.lovable.dev/resend/emails",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableApiKey}`,
          "X-Connection-Api-Key": resendApiKey,
        },
        body: JSON.stringify({
          from: FROM,
          to: [to],
          subject: normalizeBrand(subject),
          html,
        }),
      }
    );

    if (!resp.ok) {
      const text = await resp.text();
      console.error("auth-email-hook: resend send failed", resp.status, text);
      return new Response(
        JSON.stringify({ error: "send_failed", status: resp.status, details: text }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auth-email-hook: unexpected error", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
