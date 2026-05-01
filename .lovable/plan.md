## Înlocuire price_id-uri Stripe cu cele Live corecte

ID-urile noi (din contul live `acct_...KBZxdkesfh`, confirmate prin prefix):

| Plan | Cycle | Price ID |
|---|---|---|
| Standard | monthly | `price_1TSEqwKBZxdkesfhjRUVTm8l` |
| Standard | yearly  | `price_1TSErCKBZxdkesfhVK7ZAABc` |
| Premium  | monthly | `price_1TSEstKBZxdkesfhvBGTOGmP` |
| Premium  | yearly  | `price_1TSEtLKBZxdkesfho910v66y` |

## Modificări

1. **`src/lib/stripePrices.ts`** — înlocuiesc cele 4 ID-uri vechi în `STRIPE_PRICES` și `PRICE_BY_PLAN`.
2. **`supabase/functions/_shared/stripePriceMap.ts`** — înlocuiesc cele 4 ID-uri vechi în `PRICE_MAP`.
3. **Redeploy** `create-checkout` și `stripe-webhook` (acesta din urmă folosește mapa pentru a converti `price_id` → plan la evenimentele de subscription).

## Verificare după deploy

Test prin tooling intern: apel la `create-checkout` cu noul `price_id` Standard monthly → trebuie să întoarcă un `url` valid de Stripe Checkout (nu mai apare „No such price”).

După aceea, atât butonul „Upgrade” din `/my-plan`, cât și selectarea unui plan plătit la finalul înregistrării artistului, vor redirecta corect către Stripe Checkout.
