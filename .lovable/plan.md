## Problema confirmată

- `mailer_autoconfirm = false` → după `supabase.auth.signUp()` userul există în `auth.users` dar **nu are sesiune** (`auth.uid()` rămâne `null` în client).
- `RegisterArtist.tsx` încearcă apoi:
  1. `supabase.storage.from('avatars').upload(...)` → RLS cere `auth.uid()::text = folder` → **eșuează**.
  2. `supabase.from('profiles').update(...).eq('id', user.id)` → RLS cere `auth.uid() = id` → **eșuează**.
- Migrarea anterioară pentru extinderea trigger-ului nu a fost commit-ată; edge function-ul pentru avatar nu a fost creat.

## Soluție

### 1. Migrare DB: extinde `handle_new_user()`

Trigger-ul deja creează `profiles` + `user_roles` din metadata. Îl extindem să mapeze și câmpurile specifice artistului din `raw_user_meta_data`:
- `phone`, `country`, `county`
- `specialization`, `experience_level` (cu cast la enum, cu validare)
- `career_start_year` (cu cast la int, cu validare)

Astfel, la `signUp` cu metadata completă, profilul artistului e populat 100% server-side, fără să depindă de o sesiune client.

### 2. Edge function nouă: `upload-artist-avatar`

- `verify_jwt = false` (userul nu are JWT încă — email neconfirmat).
- Input: `{ user_id, email, image_base64 }`.
- Validări (anti-abuse):
  - Userul există în `auth.users` și e creat în ultimele 5 minute.
  - Emailul din request match-uiește emailul userului.
  - Imaginea ≤ 5MB, MIME `image/jpeg` sau `image/png`.
- Acțiuni cu service role:
  - Upload la `avatars/{user_id}/avatar.jpg` (upsert).
  - `UPDATE profiles SET avatar_url = <publicUrl> WHERE id = user_id`.

### 3. `RegisterArtist.tsx`

- La `signUp`, adaugă în `options.data` toate câmpurile artistului: `phone`, `country` (numele țării rezolvat), `county`, `specialization`, `experience_level`, `career_start_year`, plus `account_type: 'artist'`, `first_name`, `last_name`, `full_name: stageName`.
- **Șterge** `supabase.from('profiles').update(...)` (trigger-ul face totul).
- **Șterge** `supabase.storage.from('avatars').upload(...)` direct.
- Dacă `imageSrc` + `croppedAreaPixels` există: convertește la base64 și apelează `supabase.functions.invoke('upload-artist-avatar', { body: { user_id, email, image_base64 } })`. Avatarul nu mai e blocant — dacă upload-ul eșuează arătăm un toast warning, dar continuăm la plan selection.

### 4. Test end-to-end

După implementare:
- Pornesc browser-ul în preview, parcurg fluxul de înregistrare artist (4 pași + foto + parolă).
- Verific în DB că `profiles` are toate câmpurile populate corect și `avatar_url` setat.
- Confirm absența erorii „new row violates row-level security policy".

## Fișiere atinse

- nou: `supabase/migrations/<timestamp>_handle_new_user_artist_fields.sql`
- nou: `supabase/functions/upload-artist-avatar/index.ts`
- editat: `src/pages/RegisterArtist.tsx`

## Note

- `RegisterUser.tsx` rămâne neschimbat (nu face upload/update după signup).
- Google OAuth continuă să funcționeze: creează sesiune normală, iar trigger-ul completează profilul de bază din metadata Google.
