# Sincronizarea calendarului artistului

## Obiectiv
Calendarul din profilul public rămâne referința vizuală, iar Dashboard-ul păstrează toate controalele de administrare. Ambele vor folosi aceeași componentă de prezentare și aceleași stări vizuale, fără schimbări în fluxurile de rezervare sau în regulile Premium.

## Implementare
1. Extrag o componentă comună pentru structura calendarului:
   - calendarul lunar și navigarea;
   - stările Available / Booked / Unavailable;
   - legenda mobilă și desktop;
   - coloana de detalii/prompt;
   - layout-ul, spațierea și comportamentul responsive.
2. Integrez componenta comună în:
   - Dashboard, cu selectorul și controalele existente pentru salvare, ștergere și administrarea rezervărilor;
   - profilul public, cu dialogurile și acțiunile existente pentru cererea de rezervare.
3. Păstrez textele și acțiunile specifice rolului:
   - owner: „My Calendar” și „Select a date to set availability”;
   - public: „Calendar” și „Select a date to send a booking request”.
4. Normalizez interpretarea stărilor astfel încât `busy`/`booked` și `blocked`/`unavailable` să aibă aceeași reprezentare în ambele contexte.
5. Păstrez tab-ul Calendar și stilul lui actual sincronizat cu celelalte tab-uri ale profilului.

## Date și comportament păstrate
- Dashboard citește calendarul proprietarului prin `get_my_calendar_events` și scrie în `calendar_events`.
- Profilul public citește aceeași stare din `calendar_events` prin `get_public_calendar`, care expune numai informațiile permise public.
- Nu modific cererile de rezervare, notificările, statusurile, permisiunile, stocarea sau intervalele orare Premium.
- Nu adaug nicio sursă nouă de date și nu schimb schema backend.

## Verificare
- Compar calendarul Dashboard/public pe desktop, tabletă și mobil.
- Verific aceeași lună, aceleași stări și aceeași legendă.
- Verific managementul owner: selectare, salvare, ștergere și detalii read-only pentru trecut.
- Verific public: selectare dată, dialog de disponibilitate și deschiderea fluxului de rezervare.
- Confirm că actualizarea din Dashboard este reflectată de citirea publică și că intervalele Premium rămân funcționale.
- Verific build-ul și erorile runtime după refactorizare.

## Fișiere estimate
- componentă comună nouă în `src/components/`;
- `src/pages/Dashboard.tsx`;
- `src/pages/ArtistProfile.tsx`.
