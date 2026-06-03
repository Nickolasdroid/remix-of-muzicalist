## Obiectiv
La fiecare plată Stripe reușită (abonament Standard/Premium, lunar/anual), Muzicalist emite automat o factură fiscală în SmartBill către clientul plătitor (persoană fizică sau juridică) și salvează linkul facturii.

## 1. Secrets de adăugat
Voi cere prin `add_secret`:
- `SMARTBILL_USERNAME` — email-ul contului SmartBill
- `SMARTBILL_API_TOKEN` — tokenul API SmartBill
- `SMARTBILL_CIF` — CIF-ul Muzicalist (ex. `RO12345678`)
- `SMARTBILL_SERIES` — seria facturilor (ex. `MUZ`)
- `SMARTBILL_VAT_PAYER` — `true`/`false` (plătitor TVA)

## 2. Schimbări în baza de date (migrare)
Adăugăm date de facturare pe `profiles` (toate opționale, completate de user):
- `billing_entity_type` text — `individual` | `company`
- `billing_name` text — nume persoană sau denumire firmă
- `billing_cui` text — CUI/CIF (doar PJ)
- `billing_reg_com` text — Nr. Registrul Comerțului (PJ)
- `billing_address` text, `billing_city` text, `billing_county` text, `billing_country` text (default `Romania`)
- `billing_vat_payer` boolean default false

Tabel nou `invoices`:
- `profile_id`, `stripe_event_id` (unic), `stripe_invoice_id`, `stripe_subscription_id`
- `smartbill_series`, `smartbill_number`, `smartbill_url`
- `amount`, `currency`, `status` (`issued` | `failed` | `skipped`)
- `error_message`, `issued_at`
- RLS: user vede doar facturile sale; admins văd tot; insert/update doar `service_role`.

## 3. UI — date de facturare
În **Settings → Billing** (sau secțiune nouă "Date de facturare"):
- Toggle PF/PJ
- Câmpuri condiționate (CUI + RegCom doar la PJ)
- Buton Save → update `profiles`
- Dacă userul nu a completat, factura se va emite ca PF cu numele/emailul din profil.

În **My Plan**, listă "Facturile mele" cu data, suma, status și buton "Descarcă PDF" (link SmartBill).

## 4. Edge functions
**`stripe-webhook` (existent)** — la evenimentul `invoice.payment_succeeded`:
- Dacă există deja un rând în `invoices` cu acel `stripe_event_id` → skip (idempotență).
- Apelează intern `smartbill-issue` cu `profile_id` + datele facturii Stripe.

**`smartbill-issue` (nou, `verify_jwt = false`, apelată doar server-side)**:
- Citește profilul + datele de facturare.
- Construiește payload SmartBill (`POST https://ws.smartbill.ro/SBORO/api/invoice`) cu Basic Auth `USERNAME:API_TOKEN`.
- `client`: dacă PJ → `vatCode`, `name`, `regCom`, `address`, `city`, `county`, `country`, `isTaxPayer`; dacă PF → `name`, `email`, `address`, `country`, `isTaxPayer=false`, `saveToDb=false`.
- `products`: o linie cu `name`="Abonament Muzicalist {Standard/Premium} {lunar/anual}", `price` (din Stripe, în RON dacă acceptă, altfel currency Stripe), `currency`, `isService=true`, `measuringUnitName="buc"`, `quantity=1`, cota TVA.
- `seriesName` = `SMARTBILL_SERIES`, `companyVatCode` = `SMARTBILL_CIF`, `issueDate` = azi, `dueDate` = azi.
- `sendEmail: true` cu emailul clientului (SmartBill trimite factura automat pe email).
- La succes → insert în `invoices` cu seria + numărul + URL PDF (`https://ws.smartbill.ro/SBORO/api/invoice/pdf?cif=...&seriesname=...&number=...`).
- La eroare → insert cu `status=failed` + `error_message` (pentru retry manual din admin).

**`smartbill-list` (nou, JWT verificat)**: returnează facturile userului curent pentru UI.

## 5. Admin dashboard
Tab nou "Facturi" — listă globală cu filtre (status, dată, user), buton "Retry" pentru cele cu status `failed`.

## 6. Tehnic
- Toate cererile SmartBill prin `fetch` direct din edge function (SmartBill API e REST simplu, fără SDK necesar).
- Sumele Stripe sunt în cenți → conversie /100 înainte de a le trimite.
- Conversia currency: trimitem la SmartBill în aceeași monedă ca pe Stripe (SmartBill acceptă EUR/USD pe lângă RON).
- Idempotența garantată de `unique(stripe_event_id)` pe `invoices`.

## Out of scope (pot fi adăugate ulterior)
- Storno automat la refund/cancel (poate fi adăugat ușor pe `charge.refunded`).
- E-Factura ANAF (SmartBill o trimite automat dacă e activat în contul lor — fără cod suplimentar).
- Proforme pentru plăți manuale.
