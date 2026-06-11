## Problem

Eroarea `Edge Function returned a non-2xx status code` la upgrade de plan vine din `create-checkout`. Logurile arată:

> `No such customer: 'cus_UTKOdGdP4SYz6Z'; a similar object exists in live mode, but a test mode key was used to make this request.`

Profilul tău (și probabil al altor useri existenți) are `stripe_customer_id` salvat din **contul Stripe vechi (live)**. Acum folosim cheia test a contului nou, deci Stripe nu mai găsește acel customer și checkout-ul eșuează.

În plus, price ID-urile din `src/lib/stripePrices.ts` și `supabase/functions/_shared/stripePriceMap.ts` aparțin tot contului vechi — vor da `No such price` chiar și după ce reparăm customer-ul. (Aștept noile price IDs.)

## Fix

**1. `supabase/functions/create-checkout/index.ts`** — înainte de a folosi `stripe_customer_id` salvat, îl validez în modul Stripe curent. Dacă Stripe răspunde `resource_missing`, îl tratez ca inexistent și creez unul nou (apoi îl scriu peste în `profiles`). Același tratament dacă customer-ul a fost șters.

```ts
if (customerId) {
  try {
    const existing = await stripe.customers.retrieve(customerId);
    if ((existing as any).deleted) customerId = null;
  } catch (e) {
    if (e?.code === "resource_missing") customerId = null;
    else throw e;
  }
}
if (!customerId) {
  // create + persist (cod existent)
}
```

**2. `supabase/functions/customer-portal/index.ts`** — aplic exact aceeași logică (probabil are aceeași problemă când userul vrea să-și gestioneze abonamentul).

**3. Curățare DB (opțional, recomandat)** — pot rula un update care șterge `stripe_customer_id` și câmpurile de subscription pentru toți userii care au valori vechi, ca să pornim curat în mediul de test. Pot să-l las și fără: codul de mai sus repară lazy, la prima cerere.

## Ce NU rezolvă acest fix

Price IDs vechi → tot vor da eroare la checkout. Trimite-mi cele 4 `price_...` din noul cont Stripe (test mode) pentru Standard lunar/anual și Premium lunar/anual ca să le actualizez în `stripePriceMap.ts` și `stripePrices.ts`.

Vrei să implementez fix-ul de mai sus și să fac și curățarea în DB?
