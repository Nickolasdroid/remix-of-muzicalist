## Problem

La înregistrarea unui cont de artist apare:
> `duplicate key value violates unique constraint "user_roles_user_id_key"`

## Cauza

În migrarea adăugată recent pentru Google sign-up am creat trigger-ul `handle_new_user()` care rulează automat `AFTER INSERT ON auth.users` și creează **automat**:
- un rând în `profiles`
- un rând în `user_roles` (default `'user'`, sau `'artist'` doar dacă `raw_user_meta_data.account_type = 'artist'`)

Dar `RegisterArtist.tsx` (și `RegisterUser.tsx`) au fost scrise înainte de trigger și încă fac **manual** `INSERT` în `user_roles` și `profiles` după `signUp()`. Rezultă conflict pe cheia unică `user_roles_user_id_key`.

În plus, `signUp` din `RegisterArtist.tsx` nu trimite `account_type: 'artist'` în metadata, deci trigger-ul ar crea greșit rolul `'user'` pentru artiști.

## Soluție

Aliniem fluxul cu trigger-ul (single source of truth):

### 1. `RegisterArtist.tsx` — `handleSubmit`
- La `supabase.auth.signUp(...)` adăugăm în `options.data`:
  - `account_type: 'artist'`
  - `first_name`, `last_name`, `full_name: stageName` (ca trigger-ul să populeze profilul corect)
- **Eliminăm** `INSERT` manual în `user_roles` (trigger-ul îl face cu rolul corect `'artist'`).
- Înlocuim `INSERT` în `profiles` cu **`UPDATE` (sau `upsert` cu `onConflict: 'id'`)** pentru a completa câmpurile specifice artistului (`stage_name`, `phone`, `country`, `county`, `specialization`, `experience_level`, `career_start_year`, `avatar_url`) peste rândul deja creat de trigger.

### 2. `RegisterUser.tsx` — `handleSubmit`
- La `supabase.auth.signUp(...)` păstrăm `data.first_name` (deja există) și adăugăm `account_type: 'user'` pentru claritate.
- **Eliminăm** `INSERT` manual în `user_roles` (deja creat de trigger ca `'user'`).
- **Eliminăm** `INSERT` manual în `profiles` (deja creat de trigger din metadata) — sau opțional `update` dacă vrem să suprascriem ceva (nu e cazul aici, fiindcă trigger-ul completează tot ce avem).

### 3. Fără modificări la baza de date
Trigger-ul curent este corect și acoperă atât signup cu email/parolă cât și Google OAuth. Nu schimbăm migrările.

## Rezultat

- Artiști noi → trigger creează profil + rol `artist`; codul UPDATE-ează profilul cu detaliile artistului. Niciun duplicate key.
- Useri noi → trigger creează profil + rol `user`. Niciun insert manual.
- Google sign-up funcționează la fel ca până acum.