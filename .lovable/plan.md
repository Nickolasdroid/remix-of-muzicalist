## Problemă

Două probleme distincte, ambele cauzate de aceeași rădăcină — **price_id-urile Stripe hardcodate sunt invalide**.

### 1. Eroare la upgrade din `/my-plan`
Edge function `create-checkout` returnează 500 cu mesajul Stripe:
```
No such price: 'price_1SXue3KVhMSJTGUNUbW6ZWLb'
No such price: 'price_1SXuaaKVhMSJTGUNuogDwKwH'
```
Toate cele 4 price_id din `src/lib/stripePrices.ts` și `supabase/functions/_shared/stripePriceMap.ts` nu există în contul Stripe conectat (sau sunt din alt mod — test vs live).

### 2. Înregistrare artist nu redirecționează la plată
La final, `handleSubmit` apelează `setShowPlanSelection(true)` și afișează ecranul de planuri. Apăsarea pe Standard/Premium apelează `startCheckout(...)` → `create-checkout` → **eșuează cu același 500** din cauza price_id-ului invalid → toast cu eroare → utilizatorul rămâne pe pagină. Cred că „mă duce direct la profil” înseamnă că primesc toast-ul de eroare și apoi navighează manual sau apasă Free.

**Concluzie:** o singură reparație (price_id-uri corecte) rezolvă ambele simptome.

## Soluție

### Pas 1 — Obținere price_id-uri reale (necesită input de la tine)

Nu pot ghici ID-urile corecte din Stripe Dashboard. Am nevoie de cele 4 price_id-uri active din contul Stripe live (cel pe care îl folosește `STRIPE_SECRET_KEY` configurat):

- Standard — lunar
- Standard — anual
- Premium — lunar
- Premium — anual

Le găsești în Stripe Dashboard → Products → fiecare produs → secțiunea Pricing → copiezi `price_xxx`.

Important: dacă `STRIPE_SECRET_KEY` începe cu `sk_live_`, ai nevoie de price_id-uri din modul **Live**. Dacă începe cu `sk_test_`, ai nevoie de cele din modul **Test**. Cele patru ID-uri actuale par să fie din alt mod sau din alt cont, motiv pentru care Stripe spune „No such price”.

### Pas 2 — Actualizare cod

Înlocuiesc cele 4 ID-uri în:
- `src/lib/stripePrices.ts` (frontend)
- `supabase/functions/_shared/stripePriceMap.ts` (backend)

### Pas 3 — Hardening edge function `create-checkout`

Adaug:
- log la început cu prefix-ul cheii (`sk_test_` vs `sk_live_`) și cu `price_id` primit, ca să fie ușor de diagnosticat pe viitor
- mesaj de eroare clar întors clientului când Stripe returnează `resource_missing` (în loc de 500 generic), ex: „Stripe price not found — check that price IDs match your Stripe mode (test/live).”

### Pas 4 — Redeploy + verificare

Redeploy `create-checkout`, apoi testez prin tooling intern pentru a confirma că un user logat primește un URL valid de checkout.

## De care am nevoie de la tine

Te rog trimite-mi cele 4 `price_xxx` din Stripe Dashboard (sau confirmă că vrei să le adăugăm tu/eu împreună). Fără ele, orice altă reparație e degeaba — Stripe va respinge în continuare cererea.
