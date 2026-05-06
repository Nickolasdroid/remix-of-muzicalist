## Problema

După ce un artist completează înregistrarea și e dus la pagina Stripe Checkout, dacă apasă "Back" în Stripe, e redirecționat către o pagină inexistentă și apare eroare 404.

**Cauza:** în `src/pages/RegisterArtist.tsx`, `cancel_url` e setat la `/register-artist?checkout=cancelled`, dar ruta reală în `App.tsx` este `/register/artist`. În plus, chiar dacă URL-ul ar fi corect, după revenire utilizatorul ar pica pe pasul 0 (introdu email) — contul e deja creat, dar starea React e pierdută, iar selecția de plan nu se mai afișează.

## Soluția

1. **Corectez ruta cancel** din `/register-artist?checkout=cancelled` în `/register/artist?checkout=cancelled`.
2. **Persist `registeredUserId`** în `sessionStorage` înainte de a redirecționa la Stripe, ca să-l pot recupera la revenire.
3. **La montarea paginii `RegisterArtist`**, detectez `?checkout=cancelled` în URL:
   - Dacă există un `registeredUserId` salvat, sar peste toți pașii de formular și afișez direct ecranul de selecție plan (`showPlanSelection = true`), cu un toast informativ ("Plata a fost anulată — alege un plan pentru a continua.").
   - Dacă nu există ID salvat (ex: utilizatorul a șters storage-ul), afișez un mesaj prietenos și îl trimit la `/login` ca să se autentifice și apoi să aleagă planul din `/plans`.
4. **Curăț `sessionStorage`** după ce planul e selectat cu succes sau după ce utilizatorul părăsește fluxul.
5. Aceeași corecție o aplic și la fluxul user obișnuit dacă există un cancel_url similar (verific `RegisterUser.tsx`).

## Detalii tehnice

- Fișier modificat: `src/pages/RegisterArtist.tsx` (cancel_url + un `useEffect` nou de restaurare + `sessionStorage.setItem("artist_pending_uid", id)` înainte de `startCheckout`).
- Verific și `src/pages/RegisterUser.tsx` pentru același pattern.
- Nu sunt necesare modificări în edge function `create-checkout` — primește deja `cancel_url` din client.
- Nu sunt modificări de bază de date.

## Rezultat

Când utilizatorul apasă Back în Stripe Checkout după înregistrarea ca artist, va ajunge înapoi pe ecranul de alegere a planului, cu contul deja creat intact, și va putea reîncerca plata sau alege Free.
