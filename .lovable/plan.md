## Problema

După înregistrarea unui cont de artist, contul este creat dar **emailul nu este confirmat**, deci `supabase.auth.signUp` nu returnează o sesiune. Când utilizatorul apasă „Choose Premium/Standard", `startCheckout` cheamă `supabase.auth.getSession()` → nu există sesiune → afișează „Please sign in to continue".

Edge function-ul `create-checkout` impune `Authorization: Bearer <jwt>` și respinge orice apel fără sesiune.

## Soluția

Aplicăm același pattern ca la `upload-artist-avatar`: lăsăm edge function-ul să accepte un `user_id` direct, validând server-side că utilizatorul există și a fost creat recent (≤ 30 minute), folosind service role key. Asta permite checkout imediat după sign-up, fără să așteptăm confirmarea emailului.

## Modificări

### 1. `supabase/functions/create-checkout/index.ts`
- Dacă există `Authorization: Bearer ...` valid → folosim user-ul din JWT (comportament actual, neschimbat pentru utilizatorii logați).
- Altfel, dacă body-ul conține `user_id`:
  - Folosim service role pentru `auth.admin.getUserById(user_id)`.
  - Verificăm `created_at` ≤ 30 minute în urmă (fereastră post-înregistrare).
  - Continuăm cu logica de checkout existentă (customer Stripe, sesiune, etc.).
- Restul logicii (creare customer, sesiune Stripe) rămâne identic.

### 2. `supabase/config.toml`
- Adăugăm bloc pentru `create-checkout` cu `verify_jwt = false` ca să permitem apelul fără sesiune.

### 3. `src/lib/checkout.ts`
- `startCheckout` acceptă opțional `userId?: string`.
- Dacă nu există sesiune **și** este furnizat `userId`, trimitem `user_id` în body în loc să eșuăm cu „Please sign in to continue".

### 4. `src/pages/RegisterArtist.tsx`
- În `handlePlanSelect`, transmitem `userId: registeredUserId` către `startCheckout`.

## Securitate

- Validarea cu service role + fereastra de 30 minute previne abuzul (nu poți crea checkout pentru alt user random).
- Pentru utilizatorii deja logați, comportamentul rămâne neschimbat (verificare JWT).
- `customer-portal` rămâne neschimbat (necesită mereu sesiune).

## Fișiere atinse

- `supabase/functions/create-checkout/index.ts` (editare)
- `supabase/config.toml` (editare)
- `src/lib/checkout.ts` (editare)
- `src/pages/RegisterArtist.tsx` (mică editare în `handlePlanSelect`)
