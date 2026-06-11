Sincronizează ID-urile de preț Stripe pentru planurile Premium Monthly și Standard Monthly între frontend și edge functions.

Fișiere modificate:
- `src/lib/stripePrices.ts` (frontend mirror)
- `supabase/functions/_shared/stripePriceMap.ts` (edge functions)

Modificări:
1. În ambele fișiere, actualizează prețul Premium monthly de la `price_1ThCmNKBZxdkesfhZpGJso7s` la `price_1TSEstKBZxdkesfhvBGTOGmP`.
2. În ambele fișiere, actualizează prețul Standard monthly de la `price_1TSEqwKBZxdkesfhjRUVTm8l` la `price_1TehLJKBZxdkesfhhiBU1I2T`.

Planul include doar modificări de string în cele două fișiere de mapare; nu este necesară nicio altă modificare de cod sau logică.