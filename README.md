# Muzicalist

A marketplace that connects music artists with people who book them. Web app (React) plus an
Android app (Capacitor), on Supabase and Vercel.

## Stack

- Vite, React, TypeScript, Tailwind CSS, shadcn/ui
- Supabase: Postgres (RLS), Auth (email and Google), Storage, Edge Functions (Deno)
- Vercel (hosting, deployed from `main`), Stripe (subscriptions)
- Capacitor (Android)

## Run locally

```sh
npm install
npm run dev
```

The app reads two public values from `.env`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_GOOGLE_WEB_CLIENT_ID=...
```

Other scripts: `npm run build`, `npm run lint`, `npx vitest run`.

## Backend

- `supabase/migrations/` — database schema, functions and policies.
- `supabase/functions/` — edge functions. Email is sent through the Muzicalist mailboxes over
  SMTP (`_shared/smtp.ts`); setup and secrets are in `docs/auth-email-templates/README.md`.
- Account emails (confirm, reset password, …) are sent by Supabase Auth; their HTML is in
  `docs/auth-email-templates/`.

## Deploy

Pushing to `main` deploys to Vercel. Edge function secrets live in Supabase
(Edge Functions → Secrets): Stripe keys, `SMTP_*`, and the password-encryption key.
