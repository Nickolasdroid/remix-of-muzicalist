# Redesign secțiune Experience (mobil)

Aplic același layout cu 3 coloane pe carduri compacte, vizibile DOAR pe mobil. Pe desktop păstrez stilul actual neschimbat.

## Locații
- `src/pages/Dashboard.tsx` ~linia 2150-2163 (modul vizualizare, nu editare)
- `src/pages/ArtistProfile.tsx` ~linia 1197-1209

## Design nou (mobil)
Container cu `rounded-lg border border-border bg-secondary/30 p-3`, grid `grid-cols-3 divide-x divide-border`. Fiecare coloană centrată vertical, text centrat:

```
┌─────────────┬─────────────┬─────────────┐
│ Profesional │     0       │   Din 2020  │
│   Nivel     │  Evenimente │    Activ    │
└─────────────┴─────────────┴─────────────┘
```

- **Stânga**: `experience_level` (mare, bold, accent) + label „Nivel"
- **Mijloc**: `acceptedEventsCount` (mare, bold, accent) + label „Evenimente"
- **Dreapta**: `Din {careerStartYear}` (mare, bold, accent) + label „Activ"

Valori: `text-base font-bold text-foreground`. Labels: `text-xs text-muted-foreground mt-0.5`.

Folosesc `md:hidden` pentru noul layout și `hidden md:block` pentru lista veche cu iconițe (păstrată pe desktop).

## Note
- Textele rămân în engleză ca în restul aplicației (`Level`, `Events`, `Since`) — exemplele RO din imagini sunt doar referință vizuală.
- Fără modificări la backend, modul de editare sau la datele afișate.
- Iconul ✏️ de editare (Dashboard) rămâne neschimbat în header-ul secțiunii.
