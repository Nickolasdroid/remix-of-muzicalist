# Fix: Google sign-up nu salvează profilul user-ului

## Cauza problemei

În `RegisterUser.tsx`, profilul (`profiles`) și rolul (`user_roles`) sunt create **doar** în `handleSubmit` (flow-ul email/parolă). Funcția `handleGoogleSignUp` apelează doar `lovable.auth.signInWithOAuth("google", ...)`, care:

1. Redirecționează către Google
2. La revenire, setează sesiunea Supabase
3. **Atât.** Nu există nicio logică post-OAuth care să insereze rândurile în `profiles` și `user_roles`.

Rezultat: utilizatorul autentificat cu Google ajunge logat în Supabase Auth, dar fără rând în `profiles` și fără rol în `user_roles` → apare ca "fantomă" în baza de date, iar `Login.tsx` nu îl poate redirecționa corect (roleData e null → cade pe `/dashboard`).

În plus, `Login.tsx` are același buton Google — același bug se aplică și acolo dacă userul intră direct prin Login fără să fi avut cont anterior.

## Soluția

Folosim soluția standard Supabase: **un trigger pe `auth.users`** care creează automat `profiles` + `user_roles` când apare un user nou. Avantaje:

- Funcționează indiferent de unde se înregistrează userul (Google din RegisterUser, Google din Login, email/parolă, viitoare provideri).
- Idempotent — folosim `ON CONFLICT DO NOTHING`, deci nu strică flow-urile email/parolă existente care fac insert manual.
- Se bazează pe `raw_user_meta_data` pe care Google îl populează cu `full_name`, `name`, `email`, `avatar_url`.

### Pași

**1. Migrare SQL** — funcție + trigger pe `auth.users`:

- `handle_new_user()` SECURITY DEFINER care:
  - Determină numele din `raw_user_meta_data` (`full_name` sau `name` pentru Google, `first_name` pentru email/parolă, fallback pe partea din email înainte de `@`).
  - Inserează în `public.profiles` cu `id`, `first_name`, `last_name=''`, `email`, `stage_name=name`, `phone=''`, `county=''`, `avatar_url` (din meta dacă există) — `ON CONFLICT (id) DO NOTHING`.
  - Determină rolul: dacă `raw_user_meta_data->>'account_type' = 'artist'` → `'artist'`, altfel `'user'`. (Adminul rămâne setat manual în DB; nu se atribuie niciodată automat.)
  - Inserează în `public.user_roles` cu `user_id` și `user_type` — `ON CONFLICT DO NOTHING` (necesită un unique index pe `user_id` — îl adăugăm dacă lipsește).
- Trigger `AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`

**2. `src/pages/RegisterUser.tsx`** — păstrăm insert-urile manuale existente (rămân idempotente datorită `ON CONFLICT`); nicio schimbare necesară aici, dar ne asigurăm că funcționează în continuare.

**3. `src/pages/Login.tsx`** — în `useEffect`-ul existent care verifică sesiunea după login, dacă `roleData` lipsește (caz extrem de race condition cu trigger-ul), așteptăm scurt și reîncercăm o dată înainte de a redirecționa.

**4. RegisterArtist.tsx** — neatins. Google nu e disponibil acolo (per memoria existentă), iar flow-ul artist setează singur `pending_account_type` și inserează profilul după pasul 0; trigger-ul nu va suprascrie nimic datorită `ON CONFLICT`.

## Verificare

- Sign-up cu Google din `/register/user` → după redirect, în DB apare un rând în `profiles` (cu email + nume din Google) și un rând în `user_roles` cu `user_type='user'`.
- Login.tsx îl detectează și îl trimite la `/user-dashboard`.
- Sign-up email/parolă rămâne funcțional (insert-urile manuale nu eșuează datorită `ON CONFLICT DO NOTHING`).
- Adminul existent nu este afectat (trigger-ul pune doar `'user'` sau `'artist'`, niciodată `'admin'`).
