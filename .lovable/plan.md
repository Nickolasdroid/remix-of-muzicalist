## Stripe mode confirmation

**Muzicalist is currently in LIVE mode.** All three webhook events received so far have `livemode: true` on the Stripe payload, which means `STRIPE_SECRET_KEY` is an `sk_live_...` key and the price IDs in `stripePriceMap.ts` are live-mode prices.

### Why this matters
- Using card `4242 4242 4242 4242` on `/plans` right now will be rejected by Stripe — test cards do not work against a live key.
- A real card on `/plans` would create a real charge for the Standard or Premium price and trigger a real SmartBill fiscal invoice.

### Safe options to verify SmartBill end-to-end without charging a real card

**Option A — Recommended: invoke the existing `smartbill-retry-invoice` against a synthetic Stripe invoice (no money moves).**
The function already builds a SmartBill payload from a `profiles` row + an invoice descriptor. I will add a one-shot admin-only path (or a temporary CLI call) that calls `issueSmartBillInvoice(profile, { id: 'TEST-<ts>', amount_paid: 100, currency: 'ron', number: 'TEST-...' })` for a chosen profile. The result is logged and an `invoices` row is written. No Stripe charge involved.

**Option B — Add a test-mode key alongside live (cleanest long-term).**
Add `STRIPE_TEST_SECRET_KEY` and `STRIPE_TEST_WEBHOOK_SECRET` as secrets, plus a `STRIPE_MODE` switch (`live` / `test`) read by the checkout + webhook functions. Re-create the four prices in Stripe test mode, add a parallel `PRICE_MAP_TEST`. Then `/plans` will work with `4242 4242 4242 4242` while live continues serving real users. This is a bigger change (~30 minutes of work) and requires the user to create 4 prices in their Stripe test dashboard.

**Option C — Use Stripe live mode with a 100% off promotion code on a 1 RON Standard price.**
Issue a 100%-off coupon in Stripe live, expose `allow_promotion_codes` (already enabled), check out from `/plans` with a real card, apply the code → invoice for 0.00 RON is generated → SmartBill fiscal invoice is issued for 0.00 RON. No money moves, but it creates a real (zero-amount) SmartBill invoice in your fiscal records, which you may not want.

### Plan

1. **Confirm with you which option you want**:
   - A (synthetic SmartBill call, fastest, no fiscal side-effects)
   - B (full Stripe test mode wiring)
   - C (live 100% promo code)
2. After you pick, I implement it and we read the logs together to verify the SmartBill request and `invoices` row.

### Recommendation

Go with **Option A** first — it directly answers "does the SmartBill code path issue a valid fiscal invoice with the user's billing details?" with zero risk. If A succeeds, the live webhook will succeed on the next real subscription. Then optionally add B for ongoing test coverage.

No code changes yet — waiting for your choice.
