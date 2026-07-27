## Ce am verificat

- Nu există nicăieri în aplicație un buton de „șterge poza de profil”. Funcția `handleRemoveAvatar` din `src/pages/Dashboard.tsx` (linia 746) există, dar nu este folosită în interfață — este cod mort.
- La înregistrarea ca artist (`src/pages/RegisterArtist.tsx`), pasul 3 verifică doar că utilizatorul a *selectat* o imagine (`imageSrc`), nu și că imaginea a fost efectiv decupată și încărcată.
- Uploadul propriu-zis se face după crearea contului, într-un bloc `try/catch` care doar scrie un avertisment în consolă. Dacă apelul eșuează — sau dacă zona de decupare nu a fost calculată — contul se creează oricum, fără poză.
- În baza de date, cele 4 conturi fără poză (DJ VAELT, DjMarcu, Dj markuss, Elys) provin toate din înregistrarea pe email, fără o înregistrare în așteptare asociată. Deci nu s-a șters nimic: poza pur și simplu nu a ajuns niciodată pe server.

Concluzie: nu a fost o ștergere, ci o scăpare în fluxul de înregistrare.

## Ce vom face

1. **Validare reală la pasul 3 din înregistrare**
   - Pe lângă `imageSrc`, se verifică și existența zonei de decupare; dacă lipsește, se calculează implicit (imaginea întreagă) în loc să fie ignorată.

2. **Uploadul devine blocant, nu „best effort”**
   - Înainte de finalizare, imaginea decupată se generează și se validează.
   - Dacă apelul către funcția de upload eșuează, se reîncearcă automat de câteva ori.
   - Dacă tot eșuează, utilizatorul primește un mesaj clar de eroare și rămâne pe pas, în loc ca înregistrarea să continue fără poză.

3. **Verificare finală**
   - După upload se confirmă că profilul are efectiv poză salvată; altfel se semnalează eroarea.

4. **Curățare**
   - Se elimină funcția nefolosită de ștergere a pozei din dashboard, ca să nu poată fi reactivată accidental. Rămâne doar înlocuirea pozei.

Conturile existente fără poză rămân neatinse, conform alegerii tale.

## Detalii tehnice

- Fișiere: `src/pages/RegisterArtist.tsx` (validare pas 3, `getAvatarBase64`, `handleSubmit`), `src/pages/Dashboard.tsx` (ștergere cod mort `handleRemoveAvatar`).
- Fără modificări de bază de date și fără modificări la funcția `upload-artist-avatar`.
