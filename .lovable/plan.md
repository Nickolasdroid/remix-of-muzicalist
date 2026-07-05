# Extindere animație welcome la planul Free

## Situația actuală
Animația `ArtistWelcomeAnimation` se afișează doar pe ramura de succes a checkout-ului Stripe (plan Standard/Premium), în `useEffect`-ul care tratează `?checkout=success`. Pentru planul Free, `handleFreeSignup` face direct `navigate("/dashboard")` fără să treacă prin animație.

## Modificare propusă

În `src/pages/RegisterArtist.tsx`, funcția `handleFreeSignup`:

- Se elimină toast-ul de succes și `navigate("/dashboard" | "/login?...")` imediat.
- În loc de navigare directă, se setează `welcomeArtistName` cu `formData.stageName || formData.firstName` — asta declanșează exact același overlay ca la planurile plătite (auto-dismiss după ~4.5s, fără posibilitatea de a rămâne).
- Pentru cazul în care Supabase cere confirmare email (`authData.session` lipsă), se păstrează comportamentul existent (redirect la `/login?signup=success&email=...`) fără animație — nu are sens să arătăm „bun venit" dacă utilizatorul încă nu e logat.

## Rezultat
- Free cu sesiune activă → confetti + „Bine ai venit pe scenă, {nume}!" → `/dashboard`.
- Free cu confirmare email obligatorie → redirect direct la login (fără animație).
- Standard/Premium → comportamentul deja implementat, neschimbat.

## Fișiere atinse
- `src/pages/RegisterArtist.tsx` (doar `handleFreeSignup`)
