## Problema

Pe `/my-plan`, butoanele "Upgrade to Standard / Premium" și "Downgrade" **nu au `onClick`** — exact aceeași problemă ca cea rezolvată pe `/plans` și la înregistrare. Click → nu se întâmplă nimic.

## Soluția

În `src/pages/MyPlan.tsx`:

1. **Import** helperele existente:
   ```ts
   import { startCheckout, openCustomerPortal } from "@/lib/checkout";
   ```

2. **State** nou pentru loading per buton: `actionLoading: string | null`.

3. **Handler** `handlePlanAction(planId, isDowngrade)`:
   - Dacă `planId === 'Free'` **sau** `isDowngrade` → `openCustomerPortal(window.location.href)` (Stripe Billing Portal — utilizatorul anulează sau face downgrade de acolo, sursa de adevăr).
   - Altfel (upgrade către Standard sau Premium) → `startCheckout({ plan, billing: isAnnual ? 'yearly' : 'monthly', successUrl: '/my-plan?checkout=success', cancelUrl: '/my-plan?checkout=cancelled' })`.

4. **Conectez butonul** existent (linia ~160):
   - `onClick={() => handlePlanAction(plan.id, isDowngrade)}`
   - `disabled={actionLoading !== null}`
   - Label devine `Redirecting…` cât timp `actionLoading === plan.id`.

## Rezultat

- Upgrade pe `/my-plan` → redirect la Stripe Checkout cu `price_id` corect (din `PRICE_BY_PLAN`).
- Downgrade / cancel → redirect la Stripe Billing Portal.
- După plată, webhook-ul `stripe-webhook` (deja deployat) actualizează `profiles.plan / billing / subscription_status` și utilizatorul revine pe `/my-plan` cu planul nou.
