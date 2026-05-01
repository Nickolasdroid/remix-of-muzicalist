
## Ce s-a întâmplat

În implementarea anterioară am interpretat greșit cerința "Google-only registration" și am eliminat complet formularele de înregistrare cu email/parolă. Concret:

- `/register` — afișează doar două butoane "Continue with Google" (Artist / User)
- `/register/artist` și `/register/user` — fac redirect forțat către `/register`
- `/login` — **e ok**, are și email/parolă și Google (rămâne neschimbat)

Cerința corectă, așa cum o reformulezi acum: **Google = scurtătură rapidă, email/parolă = metoda principală/completă**, atât la înregistrare cât și la login.

## Ce voi modifica

### 1. `/register` (pagina de selecție tip cont)
Rămâne pagina de "alege Artist sau User", dar pe fiecare card înlocuiesc butonul unic "Continue with Google" cu **două butoane**:
- **"Register with Email"** (principal, galben) → navighează la `/register/artist` sau `/register/user`
- **"Continue with Google"** (secundar, outline) → flow-ul Google existent (cu `pending_account_type` salvat în localStorage)

### 2. `/register/artist` și `/register/user`
Restaurez formularele clasice de email/parolă (le voi reconstrui pe baza câmpurilor existente în memoria proiectului — `User Registration Flow` și schema profilelor):
- Artist: email, parolă, stage name, prenume, nume, telefon, țară, județ, specializare
- User: email, parolă, prenume, nume, telefon, țară, județ
- Validare parolă cu `PasswordStrengthIndicator` (deja există în proiect)
- La submit: `supabase.auth.signUp` + insert în `profiles` și `user_roles`
- **Important pentru regula de activare plătită**: noile conturi create cu email/parolă vor avea `is_active = false` și vor fi redirectate către `/plans?activation=required` după login (același comportament ca semnările Google noi). `ActivationGate` deja gestionează acest lucru — nu necesită modificări.

### 3. `/login`
**Neschimbat.** Are deja ambele opțiuni corect ordonate (email/parolă principal + Google secundar).

### 4. `ActivationGate` și webhook Stripe
**Neschimbate.** Logica de activare prin plată funcționează identic indiferent dacă utilizatorul s-a înregistrat cu Google sau email/parolă. Userii grandfathered (cei dinainte) rămân `is_active = true`.

## Ce NU se schimbă

- Logica de admin bypass
- Userii vechi grandfathered pe planul Free
- Webhook-ul Stripe care setează `is_active = true`
- Pagina `/plans` și banner-ul de activare
- Login-ul (deja corect)

## Detalii tehnice

**Fișiere modificate:**
- `src/pages/Register.tsx` — adaug al doilea buton "Register with Email" pe fiecare card
- `src/pages/RegisterArtist.tsx` — restaurez formularul complet (înlocuiesc redirect-ul)
- `src/pages/RegisterUser.tsx` — restaurez formularul complet (înlocuiesc redirect-ul)

**Fișiere neschimbate:**
- `src/pages/Login.tsx`
- `src/components/ActivationGate.tsx`
- `src/hooks/useActivation.ts`
- `supabase/functions/stripe-webhook/index.ts`
- Migrațiile DB (`is_active`, `pending_account_type` rămân)

**Memorie de actualizat:**
- `mem://features/auth/google-only-paid-activation` → redenumită conceptual: Google nu mai e singura cale, e doar o scurtătură. Activarea plătită rămâne obligatorie pentru toate conturile noi (indiferent de metoda de auth).

## Rezultat final

Pe `/register` utilizatorul va vedea exact cum era înainte (Artist/User) + în plus opțiunea Google ca scurtătură. Toate noile conturi (email sau Google) trec prin același gate de activare plătită.
