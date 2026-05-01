## Problema

Backend-ul Stripe (edge functions `create-checkout`, `stripe-webhook`, `customer-portal`) e deja deployat, dar **niciun buton nu îl apelează**:

- `src/pages/RegisterArtist.tsx` — `handlePlanSelect` ignoră `planName` și navighează direct la `/artist/{id}`, indiferent ce plan alege artistul.
- `src/pages/PlansPricing.tsx` — butoanele Upgrade/Get Started/Go Premium **nu au `onClick`** deloc.

Rezultatul: după sign-up, alegerea planului doar deschide profilul, fără plată.

## Soluția

### 1. Helper nou `src/lib/checkout.ts`
Funcție `startCheckout({ plan, billing })` care:
- ia `price_id` din `PRICE_BY_PLAN` (`stripePrices.ts`)
- invocă `supabase.functions.invoke('create-checkout', { body: { priceId } })`
- redirecționează `window.location.href = data.url`
- afișează toast la eroare (auth lipsă, etc.)

### 2. `src/pages/RegisterArtist.tsx` — `handlePlanSelect`
- Dacă `planName === "Free"` → rămâne navigarea către `/artist/{registeredUserId}` (comportament actual).
- Dacă `Standard` sau `Premium` → apelează `startCheckout({ plan, billing: isAnnual ? "yearly" : "monthly" })`. Stripe redirectează la success_url care duce la `/artist/{id}` (sau `/dashboard`); webhook-ul setează planul în `profiles`.
- Verific dacă există deja un toggle Monthly/Annual în pasul de plan-selection; dacă nu, îl adaug (același UI ca în PlansPricing) ca să putem trimite `billing` corect.

### 3. `src/pages/PlansPricing.tsx` — butoanele
- Adaug `onClick` pe `<Button>`:
  - **Free** sau utilizator neautentificat pe plan Free → navighează la `/register-artist` (sau `/auth` dacă nu e logat).
  - **Standard / Premium** → apelează `startCheckout({ plan: plan.id, billing: isAnnual ? "yearly" : "monthly" })`.
  - **Downgrade** sau gestionare abonament existent → apelează `customer-portal` și redirectează la link-ul Stripe Billing Portal.
- State `loading` per buton ca să previn dublu-click.

### 4. Verificare URLs în `create-checkout`
Confirm că `success_url` / `cancel_url` din edge function pointează la rute reale (`/dashboard?checkout=success`, `/plans?checkout=cancel`). Dacă nu, le ajustez.

## Rezultat
- Click pe plan plătit (la înregistrare sau pe `/plans`) → redirect la Stripe Checkout.
- După plată reușită → webhook actualizează `profiles.plan / billing / subscription_status` → user revine în app cu planul activ.
- Free rămâne flow direct, fără Stripe.
