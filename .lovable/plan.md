## Stripe Subscription System (BYOK Stripe)

You've provided your own Stripe `price_id`s, so this plan uses the **bring-your-own-key Stripe integration** (you supply your `STRIPE_SECRET_KEY` and webhook signing secret). Stripe will be the single source of truth; `price_id` will exclusively determine plan & billing.

> Note: Lovable also offers a built-in Stripe option that requires no Stripe account setup. If you'd prefer that route instead, let me know — otherwise we'll proceed with your own Stripe account as described.

---

### 1. Database changes

The existing `profiles` table already has `plan` (`'Free' | 'Standard' | 'Premium'`). Add Stripe sync fields to `profiles`:

- `stripe_customer_id` (text, nullable, unique) — Stripe Customer ID
- `stripe_subscription_id` (text, nullable, unique) — Stripe Subscription ID
- `billing` (text, nullable) — `'monthly' | 'yearly'`
- `subscription_status` (text, nullable) — `active | canceled | past_due | incomplete | trialing | unpaid`
- `subscription_current_period_end` (timestamptz, nullable) — when current period ends (for "renews on" UI)

`customer_email` is not added separately — `profiles.email` already exists and is the link key.

A `subscription_events` audit table (id, profile_id, stripe_event_id unique, event_type, payload jsonb, created_at) for idempotency and debugging. RLS: only service role writes; users can read their own (optional).

### 2. Secrets to configure

You'll add these via the secrets prompt after approval:
- `STRIPE_SECRET_KEY` — your Stripe secret key (test or live)
- `STRIPE_WEBHOOK_SECRET` — webhook signing secret from the Stripe dashboard

### 3. Edge functions

All deployed automatically. CORS handled. Service-role Supabase client used for DB writes.

**a. `create-checkout`** (auth required)
- Input: `{ price_id }`
- Validates `price_id` is one of the 4 allowed IDs.
- Looks up the user's `stripe_customer_id` from `profiles`. If missing, creates a Stripe customer with their email and saves it.
- Creates a Stripe Checkout Session in `subscription` mode with `customer`, `line_items: [{ price, quantity: 1 }]`, success/cancel URLs back to `/my-plan`.
- Returns `{ url }` for redirect.

**b. `customer-portal`** (auth required)
- Creates a Stripe Billing Portal session for the user's `stripe_customer_id`. Returns `{ url }`.
- Used for upgrades, downgrades, cancellation, payment method updates.

**c. `stripe-webhook`** (public, `verify_jwt = false` in `supabase/config.toml`)
- Verifies signature with `STRIPE_WEBHOOK_SECRET` (uses raw request body).
- Idempotency: insert `event.id` into `subscription_events`; skip if already present.
- Handles:
  - `checkout.session.completed` → fetch subscription via `subscription_id`, then run sync logic (below).
  - `customer.subscription.created` / `updated` → run sync logic from event payload.
  - `customer.subscription.deleted` → set `subscription_status='canceled'`, set `plan='Free'`, clear `stripe_subscription_id`, `billing`.
  - `invoice.payment_succeeded` → if subscription, run sync logic (keeps `current_period_end` fresh).
  - `invoice.payment_failed` → set `subscription_status='past_due'` (plan kept until Stripe cancels).

**Sync logic (shared):**
1. Resolve user: prefer lookup by `stripe_customer_id` in `profiles`; fallback to `customer_email` → `profiles.email`. If found via email, persist `stripe_customer_id`.
2. Read `price_id = subscription.items.data[0].price.id`.
3. Map via the constant table below → `plan`, `billing`. Unknown price → log + skip update of plan/billing.
4. Update `profiles`:
   - `stripe_customer_id`, `stripe_subscription_id`
   - `plan`, `billing`
   - `subscription_status = subscription.status`
   - `subscription_current_period_end = subscription.current_period_end` (epoch → timestamptz)
5. If `status` is not `active` or `trialing`, keep stored `plan` but let access control gate features (see step 5).

**Price ID map (the only place plan/billing is decided):**
```text
price_1TSEqwKBZxdkesfhjRUVTm8l → Standard / monthly
price_1TSErCKBZxdkesfhVK7ZAABc → Standard / yearly
price_1TSEstKBZxdkesfhvBGTOGmP → Premium  / monthly
price_1TSEtLKBZxdkesfho910v66y → Premium  / yearly
```

### 4. Frontend wiring

- **`src/lib/stripePrices.ts`** — exports the price-id map and a `getPriceId(plan, billing)` helper. Single source on the client.
- **`src/pages/MyPlan.tsx`** — Upgrade/Downgrade buttons:
  - If user has no `stripe_subscription_id` → call `create-checkout` with the appropriate `price_id`, redirect to Checkout.
  - If user already has a subscription → call `customer-portal` and redirect (handles upgrade/downgrade/cancel cleanly via Stripe).
  - Show current `billing` and `subscription_status` next to the active plan; show "Renews on …" from `subscription_current_period_end`.
- **`src/pages/PlansPricing.tsx`** — same checkout flow for authenticated artists; guests are routed to register first.
- **Success return** (`/my-plan?checkout=success`) — show toast and refetch profile (webhook is the source of truth, but we re-poll the profile a few times to surface the change quickly).

### 5. Access control

`src/lib/planLimits.ts` already gates features by `plan`. Add a small helper `isSubscriptionActive(profile)`:
- Returns `true` if `plan === 'Free'` OR `subscription_status ∈ {'active','trialing'}`.
- All existing limit getters wrap through a new `getEffectivePlan(profile)` that returns `'Free'` when the subscription is not active, so paid features are auto-restricted on `past_due`/`canceled`/`unpaid` without any other code changes.

### 6. Stripe dashboard setup (you do this once)

After deploy, you'll:
1. In Stripe → Developers → Webhooks, add endpoint:
   `https://ccdgoduekpiesdmkluff.supabase.co/functions/v1/stripe-webhook`
2. Subscribe to events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`.
3. Copy the signing secret → paste when prompted for `STRIPE_WEBHOOK_SECRET`.

### 7. Testing flow

1. Buy Standard monthly with Stripe test card `4242 4242 4242 4242` → webhook fires → `profiles.plan='Standard'`, `billing='monthly'`, `subscription_status='active'`.
2. From My Plan → "Manage subscription" → switch to Premium yearly in the portal → `customer.subscription.updated` fires → DB shows `Premium / yearly`.
3. Cancel in portal → `customer.subscription.deleted` → DB shows `plan='Free'`, `subscription_status='canceled'`.

### Final guarantees
- `price_id` is the only input to plan/billing decisions, server-side.
- Webhook is idempotent (event-id table) and signature-verified.
- Frontend never decides plan — only triggers checkout/portal.
- Upgrades, downgrades, cancellations all flow through Stripe's Billing Portal, so no custom proration logic is needed.
