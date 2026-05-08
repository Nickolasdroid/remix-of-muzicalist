## Obiectiv

În prezent, contul de artist se creează la pasul 4 (formular complet) prin `supabase.auth.signUp`, înainte ca artistul să aleagă un plan. Vrem ca:
- **Free** → contul se creează când userul apasă butonul Free.
- **Standard / Premium** → contul se creează DOAR după ce Stripe confirmă plata (webhook `checkout.session.completed`).
- Dacă userul abandonează plata Stripe, **nu rămâne niciun cont „orfan"** în sistem.

## Strategia

Mutăm `signUp` din `handleSubmit` în pasul de selecție plan. Pentru planurile plătite, salvăm temporar datele formularului (inclusiv parola și avatarul) într-o tabelă `pending_artist_registrations` accesibilă doar din edge functions (RLS strict, fără policies pentru utilizatori). Webhook-ul Stripe creează contul după confirmarea plății și șterge rândul din pending.

## Pași

### 1. Migrare DB — tabela `pending_artist_registrations`
- Coloane: `id` (uuid), `email`, `password_plain` (text — NU hash, e nevoie pentru `signUp`), `first_name`, `last_name`, `stage_name`, `phone`, `country`, `county`, `specialization`, `experience_level`, `career_start_year`, `avatar_base64` (text, nullable), `plan` (Standard/Premium), `billing` (monthly/yearly), `stripe_session_id` (text, nullable), `created_at`.
- RLS activat, **fără nicio policy** — accesibil doar prin service role key (edge functions).
- Index pe `stripe_session_id`.
- Cron/cleanup: rândurile mai vechi de 24h se pot șterge manual sau cu un job ulterior; pentru moment doar TTL conceptual, fără cron acum.

### 2. Edge function nouă: `create-pending-artist-checkout`
- Primește: toate câmpurile artistului + parola + avatar_base64 + plan + billing + success_url + cancel_url.
- Validează email-ul nu există deja în `profiles`.
- Validează `price_id` valid pentru `plan`+`billing`.
- Inserează rând în `pending_artist_registrations`, primește `pending_id`.
- Creează Stripe Checkout Session **fără customer existent**, folosind `customer_email`, cu `metadata: { pending_id, type: 'artist_signup' }` și același pe `subscription_data.metadata`.
- Returnează `{ url }`.

### 3. Modificare `stripe-webhook` — handler `checkout.session.completed`
- Dacă `session.metadata.type === 'artist_signup'` și există `pending_id`:
  1. Fetch rând din `pending_artist_registrations`.
  2. Creează user via `supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { account_type: 'artist', ... toate câmpurile } })`. Trigger-ul `handle_new_user` va popula `profiles` și `user_roles`.
  3. Update `profiles.stripe_customer_id` cu customer-ul din session.
  4. Dacă există `avatar_base64`, încarcă în storage `avatars/{user_id}/avatar.jpg` și update `profiles.avatar_url`.
  5. Apelează `syncSubscription` pe subscription-ul nou creat (folosind `user_id` ca `fallbackProfileId`).
  6. Șterge rândul din `pending_artist_registrations`.
- Logica existentă (cont deja creat → doar sync) rămâne pentru cazurile non-artist-signup.

### 4. Frontend — `RegisterArtist.tsx`
- **Elimin `signUp` din `handleSubmit`.** Pasul 4 (parolă) doar validează și trece la `showPlanSelection = true`. Datele formularului rămân în state. Nu mai există `registeredUserId`.
- **`handlePlanSelect("Free")`**: aici fac `signUp` cu toate datele (codul actual din `handleSubmit`), apoi upload avatar, apoi `navigate("/login")` cu toast „Cont creat, autentifică-te".
- **`handlePlanSelect("Standard"|"Premium")`**: convertesc avatarul în base64, apelez noua edge function `create-pending-artist-checkout` cu toate datele, redirect la URL-ul Stripe.
- **La revenire din Stripe (`?checkout=cancelled`)**: nu mai există cont creat. Pur și simplu re-afișez ecranul de plan cu toast „Plată anulată, alege alt plan sau încearcă din nou". Datele din formular sunt pierdute (state React reset la reload), așa că le persist temporar în `sessionStorage` înainte de a porni checkout-ul și le restaurez la cancel. Dacă storage-ul e gol, redirecționez la `/register/artist` de la zero.
- **Success URL Stripe**: `${origin}/login?signup=success&email={email}` — pagina Login afișează un toast „Cont creat cu succes, te rugăm să te autentifici" și pre-completează email-ul. (Webhook-ul rulează asincron; userul oricum trebuie să se logheze pentru că Stripe nu îi dă sesiune Supabase.)

### 5. Pagina `Login.tsx` (modificare minoră)
- Detectează `?signup=success&email=...` în URL, pre-completează email-ul și afișează toast de bun venit.

## Detalii tehnice & securitate

- **Parolă în clar temporar**: stocată în `pending_artist_registrations` cu RLS strict (nicio policy = inaccesibilă din client). Doar service_role o citește, în webhook. Rândul se șterge imediat după crearea contului. Risc minim, similar cu modul în care Stripe sandbox stochează informații sensibile temporar.
- **Avatar base64**: poate ajunge la ~500KB-2MB în `text`. Acceptabil pentru un rând temporar. Alternativ, pot să-l upload-ez direct în storage într-un folder `pending/{pending_id}/` și să stochez doar path-ul, dar adaugă complexitate; pentru moment merge cu base64 inline.
- **Idempotency webhook**: deja gestionat prin `subscription_events`. Dacă webhook-ul retry, rândul `pending_artist_registrations` deja șters → skip silent.
- **Race condition cancel**: dacă userul apasă Free imediat după ce a abandonat o sesiune Stripe pentru același email, validarea `email exists` în `signUp` va eșua dacă webhook-ul a apucat să creeze contul. Tratez eroarea cu mesaj clar.
- **Cleanup**: rândurile vechi din `pending_artist_registrations` (>24h) pot fi curățate manual sau cu un cron viitor; nu blocant acum.

## Fișiere modificate

- **Migrare nouă**: tabelă `pending_artist_registrations` + RLS.
- **Nou**: `supabase/functions/create-pending-artist-checkout/index.ts`.
- **Modificat**: `supabase/functions/stripe-webhook/index.ts` (handler nou pentru `artist_signup`).
- **Modificat**: `src/pages/RegisterArtist.tsx` (mutat signUp în plan select, integrat noua edge function).
- **Modificat**: `src/pages/Login.tsx` (detect `?signup=success`).

## Rezultat

- User completează formular → ajunge la ecran plan → niciun cont creat încă.
- Apasă Free → cont creat → redirect la login.
- Apasă Standard/Premium → Stripe Checkout → plată reușită → webhook creează cont → success URL → login cu toast.
- Renunță la Stripe → niciun cont rămâne în DB; rândul pending va expira/curăța.
