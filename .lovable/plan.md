## Obiectiv
La checkout, Stripe va cere obligatoriu utilizatorului adresa completă (țară, județ, oraș, stradă, cod poștal), astfel încât SmartBill să poată genera facturi conforme.

## Modificări

### 1. `supabase/functions/create-checkout/index.ts`
În apelul `stripe.checkout.sessions.create({...})` (linia 105) adaug:
- `billing_address_collection: "required"` — forțează completarea adresei complete (inclusiv județ / state).
- `customer_update: { address: "auto", name: "auto" }` — salvează adresa și numele pe Customer-ul Stripe (necesar pentru clienții deja existenți, altfel Stripe dă eroare când există `customer`).
- `tax_id_collection: { enabled: true }` — opțional dar recomandat pentru firme (CUI/VAT), util la facturare.

### 2. `supabase/functions/create-pending-artist-checkout/index.ts`
Aceleași 3 opțiuni adăugate la `sessions.create` (linia 92), pentru ca și înregistrarea artistului să colecteze adresa.

## Note tehnice
- Stripe trimite adresa în `customer.address` (line1, city, state, postal_code, country). Integrarea SmartBill o va citi de acolo (sau din `session.customer_details.address` în webhook).
- `state` este județul (ex. „Cluj”, „B” pentru București). Dacă SmartBill cere format specific, mapăm ulterior.
- Nu sunt necesare modificări în frontend — Stripe Checkout afișează automat câmpurile.

## Întrebare
Vrei să activez și `tax_id_collection` (CUI pentru persoane juridice), sau doar adresa?
