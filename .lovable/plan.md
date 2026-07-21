# Selector de limbă — plan

## Concluzia analizei

În codul actual, selectorul de limbă **există deja doar în Settings** (`src/components/SettingsTab.tsx`, secțiunea „Language"). Nu există selector în `Header`/`Navbar`/bottom nav. Detectarea automată din browser + IP funcționează deja la boot (`src/i18n/index.ts` cu prioritatea `localStorage → IP → navigator.languages → 'en'`).

Varianta B aleasă = **starea curentă**. Nu sunt necesare modificări de cod.

## Răspunsuri la întrebări

1. **Câți useri ar fi afectați fără selector (varianta C)?** Non-zero dar minoritar: useri cu browser într-o limbă și preferință pentru alta (turiști, expați, dispozitive partajate, useri care preferă engleza deși browserul e RO), plus useri cu limbă de browser nesuportată care ar rămâne blocați pe `en` fără posibilitate de corecție.

2. **Selectorul poate fi mutat doar în Settings și eliminat din header?** Este deja acolo și deja lipsește din header — nimic de făcut.

3. **Modificări concrete pentru varianta B:** zero. Toate mecanismele cerute există: auto-detect la boot, override persistat în `localStorage`, UI de schimbare în Settings, confirmare cu `AlertDialog`, listă `WORLD_LANGUAGES` cu search.

4. **Motiv tehnic pentru a păstra selectorul vizibil:** override pentru limbi nesuportate/greșit detectate, semnal de preferință persistat, escape hatch când traducerea AI eșuează pe o limbă. Toate se rezolvă cu selectorul în Settings — nu e nevoie să fie în header.

## Recomandare

**B — Selector doar în Settings/Profile** (deja implementat). Cea mai bună pentru MUZICALIST:
- Interfață curată în header (deja aglomerat pe mobile).
- Detectare automată acoperă >90% din cazuri fără interacțiune.
- Override manual disponibil pentru cazurile edge, fără să polueze UI-ul principal.
- Zero risc de regresie.

## Acțiuni

Niciuna. Dacă vrei totuși îmbunătățiri incrementale (ex. buton „Reset to browser default" în Settings, filtrare `WORLD_LANGUAGES` la limbile prioritare), spune-mi și fac un plan separat.
