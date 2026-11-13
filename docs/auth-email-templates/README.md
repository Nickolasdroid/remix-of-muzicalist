# Auth emails (Supabase Auth → SMTP)

Account emails (confirm signup, reset password, …) are sent by **Supabase Auth itself** through
the Muzicalist mailbox. There is no email hook, queue or third-party service any more.

## One-time setup (Supabase dashboard → Authentication)

1. **Emails → SMTP Settings** → enable custom SMTP:
   - Sender email: the mailbox (e.g. `admin@muzicalist.com`), Sender name: `Muzicalist`
   - Host: the Hostico mail server, Port: `465`, Username: the mailbox, Password: its password
2. **Emails → Templates**: for each template below paste the HTML file as the message body
   and set the subject.

| Supabase template | File | Subject |
|---|---|---|
| Confirm signup | `signup.html` | `Confirm your email • MUZICALIST` |
| Invite user | `invite.html` | `You've been invited` |
| Magic link | `magic-link.html` | `Your login link` |
| Change email address | `email-change.html` | `Confirm your new email` |
| Reset password | `recovery.html` | `Reset your password` |
| Reauthentication | `reauthentication.html` | `Your verification code` |

3. **URL Configuration**: Site URL `https://muzicalist.com`, plus the redirect URLs.

The files use Supabase's placeholders (`{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .Email }}`,
`{{ .NewEmail }}`, `{{ .SiteURL }}`). The logo is `https://muzicalist.com/muzicalist-logo.png`
(served from `public/`).

## Other emails

Welcome, admin notifications, suspension, legacy-artist and campaign emails are sent by the
edge functions through `supabase/functions/_shared/smtp.ts` using these secrets
(Supabase → Edge Functions → Secrets): `SMTP_HOST`, `SMTP_PORT` (465), `SMTP_USER`, `SMTP_PASS`,
and optionally `SMTP_FROM` / `SMTP_REPLY_TO`.
