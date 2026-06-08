## Curățare completă SmartBill

Eliminăm definitiv toate urmele integrării SmartBill din proiect. Nu există cod activ care să folosească SmartBill — doar artefacte rămase.

### 1. Ștergere secrete Supabase
Elimin cele 5 secrete neutilizate:
- `SMARTBILL_API_TOKEN`
- `SMARTBILL_CIF`
- `SMARTBILL_SERIES`
- `SMARTBILL_USERNAME`
- `SMARTBILL_VAT_PAYER`

### 2. Eliminare fișier migrare neaplicat
Șterg fișierul `supabase/migrations/20260603173828_d121df14-7033-491a-8757-6227dd6c4664.sql` care definește tabelul `invoices` (cu coloane SmartBill) și câmpuri `billing_*` pe `profiles`. Tabelul `invoices` nu există în DB, iar câmpurile billing nu sunt folosite în UI. Migrarea e doar fișier orfan în repo.

### 3. Verificare finală
Rulez `rg -i "smartbill"` peste tot proiectul pentru a confirma 0 rezultate după curățare.

### Ce NU se atinge
- `stripe-webhook` — deja curat de logica SmartBill
- Restul fluxului de abonare Stripe — neafectat
- Codul frontend — nicio referință SmartBill

### Detalii tehnice
- Secretele se șterg cu `secrets--delete_secret`
- Fișierul migrare se șterge cu `rm` (nu rulează în DB)
- Nu e nevoie de migrare nouă — schema actuală nu conține nimic SmartBill

### Rezultat
Proiect 100% curat de SmartBill: 0 secrete, 0 cod, 0 migrări, 0 referințe.
