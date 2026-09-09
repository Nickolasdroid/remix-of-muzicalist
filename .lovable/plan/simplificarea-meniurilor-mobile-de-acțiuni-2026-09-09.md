# Simplificarea meniurilor mobile de acțiuni

## Scop
Eliminarea titlurilor contextuale redundante din toate sertarele mobile deschise prin meniuri cu trei puncte, păstrând neschimbate acțiunile, etichetele, iconurile și comportamentul desktop.

## Implementare
- Actualizez componenta comună a meniurilor de acțiuni astfel încât titlul să rămână disponibil pentru accesibilitatea butonului, dar să nu mai fie afișat vizual în sertarul mobil.
- Elimin spațiul rezervat anterior antetului, astfel încât prima acțiune să urmeze natural după mânerul sertarului.
- Verific toate utilizările componentei comune pentru postări, profiluri, anunțuri și celelalte meniuri de acțiuni.
- Păstrez titlurile informative din sertare care nu sunt simple meniuri contextuale, precum comentarii, aprecieri și selectoare.

## Verificare
- Testez pe mobil meniurile pentru postare, profil, anunț și alte meniuri cu trei puncte disponibile.
- Confirm că meniurile desktop rămân neschimbate.
- Verific rezultatul vizual, erorile din aplicație și compilarea finală.
