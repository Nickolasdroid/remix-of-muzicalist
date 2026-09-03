# Restaurarea stării Available la verde

## Implementare
- În componenta comună `ArtistAvailabilityCalendar`, înlocuiesc exclusiv stilurile aurii ale stării Available cu valoarea istorică `emerald-500`.
- Aplic aceeași mapare semantică la legendă, zile disponibile/selectate și indicatorii de stare din Dashboard și profilul public, fără a duplica definițiile.
- Păstrez neschimbate culorile Booked și Unavailable și nu modific logica de calendar sau rezervare.

## Verificare
- Caut toate utilizările calendaristice Available/Disponibil pentru a confirma că nu mai folosesc accentul auriu.
- Verific profilul public și Dashboard-ul pe mobil, tabletă și desktop.
- Confirm build-ul și lipsa erorilor runtime legate de modificare.
