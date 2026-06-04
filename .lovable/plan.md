## Verification: Stripe → SmartBill for Muzicalist subscriptions

### 1. How the real subscription flow maps Stripe → Muzicalist user

There are two checkout entry points, both attach explicit metadata so the webhook can resolve a profile:

**A. Existing logged-in user upgrading plan — `create-checkout/index.ts`**
- Looks up/creates a Stripe Customer with `metadata.user_id = <profiles.id>` and stores it on `profiles.stripe_customer_id`.
- Creates a Checkout Session with:
  - `mode: "subscription"`
  - `customer: <stripe_customer_id>`
  - `metadata: { user_id }`
  - `subscription_data.metadata: { user_id }`

**B. New artist signup (deferred user creation) — `create-pending-artist-checkout/index.ts`**
- Stores all signup fields in `pending_artist_registrations`.
- Creates Checkout Session with `metadata: { type: "artist_signup", pending_id }` and same on `subscription_data.metadata`.
- The webhook creates the auth user from the pending row, then resolves `profileId = created.user.id`.

In both flows, `session.invoice` IS set (subscription mode produces a Stripe Invoice), unlike the Payment Link test that returned `session.invoice = null`.

### 2. Webhook mapping logic (`stripe-webhook/index.ts`)

For `checkout.session.completed`:
1. `profileId` from `session.metadata.user_id` (flow A) OR created from `pending_id` (flow B).
2. Persists `stripe_customer_id` onto the profile.
3. Calls `syncSubscription(...)` → updates `plan`, `billing`, `subscription_status`, period end.
4. If `session.invoice` exists, retrieves it and calls `issueAndRecord(profileId, invoice, event.id)` → calls SmartBill and writes `invoices` row (idempotent via `stripe_event_id`).

For `invoice.paid` / `invoice.payment_succeeded` (renewals + first payment fallback):
- Resolves `profileId` via `invoice.subscription → customer → profiles.stripe_customer_id`, then issues SmartBill.

Conclusion: for real Standard/Premium subscriptions the mapping is complete and SmartBill should fire on the first payment AND on every renewal.

### 3. Gaps / risks I found

1. **Uncaught exception in the function runtime** — logs show `Deno.core.runMicrotasks() is not supported` from a `https://deno.land/std@0.177.1/node/...` path. This comes from Stripe Node-style imports leaking the Node shim. Even though the function returned 200, async work after the response can be killed. Risk: subscription handlers can silently fail to complete. Fix: pin Stripe to a Deno-compatible build (use `npm:stripe@17` instead of `esm.sh/stripe@...?target=deno`) — eliminates the `deno.land/std/node` shim.
2. **No end-to-end smoke test against a real subscription** has been recorded yet (`invoices` table = 0 rows). I'll trigger a controlled verification using a Stripe CLI-equivalent: invoke `smartbill-retry-invoice` for a sample synthetic invoice OR ask you to perform one real Standard subscription test in test mode.
3. **`smartbill-retry-invoice`** exists — confirms there is already a manual path. Worth surfacing in an admin tool to backfill any failed invoice.

### 4. Plan

1. Re-pin Stripe import in `stripe-webhook` (and other functions that use it) from `esm.sh/stripe@17.5.0?target=deno` to `npm:stripe@17.5.0` to remove the Node shim and stop the uncaught exception.
2. Add a `try/catch` around `issueAndRecord` so a SmartBill failure inserts a `status: 'failed'` `invoices` row (it already does) AND is logged with the exact Stripe IDs — confirm the log line already added is sufficient.
3. Verification step (you run): trigger one real Standard-plan checkout (test mode) with a logged-in test user. Expected logs in order:
   - `received event ... type=checkout.session.completed`
   - `issuing SmartBill invoice for profile=<id> stripe_invoice=in_... amount=...`
   - SmartBill request/response dump (already added)
   - new row in `invoices` with `status='issued'` and `smartbill_number`
   - shortly after: `received event ... type=invoice.paid` → idempotent skip (`invoice already recorded for event ...`)
4. If SmartBill returns an error, the `invoices` row will have `status='failed'` with the SmartBill message — you can then click retry.

### 5. Notes for non-technical reading

- The earlier test used a Stripe Payment Link, which is a one-off payment with no customer, no subscription and no user_id attached — that's why no invoice was created. It is expected behavior.
- The real "Choose plan" buttons in Muzicalist go through a different checkout that DOES attach the user ID and produces a Stripe Invoice — SmartBill will fire there.
- The one real bug worth fixing now is the Stripe library import causing a runtime warning. After the import swap I'll ask you to run one real subscription checkout in test mode and we read the logs together.
