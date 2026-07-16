## Goal

Route all Supabase auth emails (signup confirmation, password reset, email change, magic link, reauthentication, invite) through the existing Resend integration, sent from `Muzicalist <noreply@muzicalist.com>`, with branded HTML templates that match Muzicalist's dark/gold identity. Keep `send-welcome-email` and `_shared/adminNotify.ts` untouched.

## Approach

Use Supabase's **Send Email Hook** pointed at a new edge function `auth-email-hook`. The hook receives every auth email event, we render a branded template, and send it via the existing Resend connector using the same `FROM = "Muzicalist <noreply@muzicalist.com>"`. No queueing layer, no duplicate Resend client, no changes to welcome/admin emails.

Note: we are intentionally NOT using Lovable's managed auth email scaffolder (which routes via `LOVABLE_API_KEY` and a Lovable-provisioned sender). The user explicitly wants the existing Resend + `muzicalist.com` setup reused.

## Steps

1. **Create edge function `supabase/functions/auth-email-hook/index.ts`**
   - Verifies the Supabase webhook signature using `SEND_EMAIL_HOOK_SECRET` (standard-webhooks HMAC).
   - Parses payload: `{ user, email_data: { token, token_hash, redirect_to, email_action_type, site_url, ... } }`.
   - Maps `email_action_type` → template:
     - `signup` → "Confirm your Muzicalist account"
     - `recovery` → "Reset your Muzicalist password"
     - `magiclink` → "Your Muzicalist sign-in link"
     - `email_change` / `email_change_current` / `email_change_new` → "Confirm your new email"
     - `invite` → "You've been invited to Muzicalist"
     - `reauthentication` → "Confirm it's you"
   - Builds action URL: `${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`.
   - Renders inline-styled HTML from a shared renderer (see step 2).
   - Sends via Resend REST API with `from: "Muzicalist <noreply@muzicalist.com>"`, reusing `RESEND_API_KEY` env.
   - Returns `{}` on success, proper error on failure. No CORS needed (server-to-server webhook).

2. **Create `supabase/functions/_shared/authEmailTemplate.ts`**
   - Single function `renderAuthEmail({ title, previewText, heading, bodyText, ctaLabel, ctaUrl, footerNote? })` returning full HTML.
   - Brand styling: dark background `#0B0B0F`, card `#141419`, gold accent `#D4AF37`, Montserrat/Arial font stack, rounded 12px, footer with Muzicalist wordmark, contact `contact@muzicalist.com`, unsubscribe/legal note.
   - Includes 6-digit OTP block styling for `reauthentication` where a code is shown instead of a link.
   - Small (~4KB), inline CSS only, email-client safe.

3. **Register the function in `supabase/config.toml`**
   - Add `[functions.auth-email-hook]` with `verify_jwt = false` (webhook is signed by Supabase, not JWT-authenticated).

4. **Generate & store the hook secret**
   - Use `generate_secret` to create `SEND_EMAIL_HOOK_SECRET` (standard-webhooks format `v1,whsec_<base64>`) so the edge function can verify signatures.

5. **Deploy the function**
   - `deploy_edge_functions` with `["auth-email-hook"]`.

6. **Enable the Send Email Hook in Supabase Auth**
   - Configure Auth to point the "Send Email" hook at `https://<project>.supabase.co/functions/v1/auth-email-hook` with the secret from step 4, so Supabase stops sending its default emails and calls our function instead.
   - This is done via the Auth config; if `configure_auth` doesn't expose the hook toggle, note the exact one-time step for the user (single dashboard toggle) — everything else stays automated.

## Files touched

- **New:** `supabase/functions/auth-email-hook/index.ts`
- **New:** `supabase/functions/_shared/authEmailTemplate.ts`
- **Modified:** `supabase/config.toml` (add function entry only)
- **Unchanged:** `supabase/functions/send-welcome-email/*`, `supabase/functions/_shared/adminNotify.ts`, existing Resend connector config

## Out of scope (per your instructions)

- No changes to welcome email or admin notifications
- No new Resend client wrapper or shared "email service"
- No pgmq queue / Lovable-managed email infra
- No changes to sender address (stays `Muzicalist <noreply@muzicalist.com>`)

## Confirm before I switch to build

1. Templates in **English only**, or English + Romanian (based on `user.user_metadata.locale` if present)?
2. Should the `reauthentication` email show the numeric OTP prominently, or also include a link? (Default: OTP only, since that's how Supabase uses it.)
