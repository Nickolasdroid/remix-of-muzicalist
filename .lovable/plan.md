
# Analiză sistem de limbi — MUZICALIST

Răspuns strict pe baza codului existent (`src/i18n/`, `src/components/AutoTranslatePageText.tsx`, `src/components/SettingsTab.tsx`, `supabase/functions/translate-locale`).

## 1. Ce soluție folosim

- **`i18next` + `react-i18next`** (`src/i18n/index.ts`), cu plugin-ul **`i18next-browser-languagedetector`**.
- Peste el, un strat **custom** de auto-traducere DOM: `AutoTranslatePageText.tsx` (MutationObserver + TreeWalker) care traduce automat orice text JSX / atribute `placeholder|title|aria-label`, folosind `translateTextsSync` / `translateTexts` din `src/i18n/index.ts`.
- Backend de traducere: Edge Function **`translate-locale`** (traduce AI la cerere + „dump" al dicționarului global cache-uit).

## 2. Unde sunt stocate traducerile

Trei niveluri, în această ordine de prioritate:

1. **Overrides manuale** — `src/i18n/overrides.ts` (ex: `Instrumentalist → Instrumentist`).
2. **Fișiere JSON statice (chei)** — `src/i18n/locales/en.json`, `ro.json` (chei tip `navigation.home`).
3. **Dicționar static text-to-text pentru RO** — `src/i18n/roText.ts` (~1855 linii, code-split, încărcat lazy).
4. **Cache dinamic pentru orice altă limbă**:
   - `localStorage` (`i18nextDynamic_*`, `i18nextTextDynamic_*`, versionat `TRANSLATIONS_VERSION=1`).
   - Server-side, prin `translate-locale` (dump global din DB) — deci **există și un cache central în Supabase**, refolosit între vizitatori.

Nu există fișiere JSON per-limbă pentru altceva decât `en` și `ro`.

## 3. Cum se selectează limba acum

Ordinea reală, din `getInitialLanguage()` + `applyLanguage()`:

1. `localStorage.MANUAL_LANG_KEY` (alegere manuală din Settings) — dacă există, câștigă.
2. `localStorage.COUNTRY_LANG_KEY` (cache al detecției IP anterioare).
3. `localStorage.i18nextLng` (setat de plugin-ul i18next).
4. **`navigator.languages` / `navigator.language`** — scanate toate; prima non-engleză câștigă.
5. Fallback: **detecție IP** (`ipapi.co`, Cloudflare trace, `ipwho.is`) în paralel via `Promise.any`, mapată prin `src/lib/countryLanguages.ts` (`COUNTRY_TO_LANGUAGE`).
6. Fallback final: `en`.

## 4. Detectare browser?

Da, **deja implementată** în două locuri:
- `i18next-browser-languagedetector` cu `order: ['localStorage', 'navigator', 'htmlTag']`.
- În plus, logica custom `getInitialLanguage()` care iterează `navigator.languages` pentru a găsi o preferință non-engleză (mai bună decât plugin-ul standard care ia doar primul entry).

Rezultat: traducere instantanee, fără round-trip de rețea, dacă browserul declară o limbă. Detecția IP e folosită doar când browserul spune „en" iar utilizatorul e într-o țară non-engleză.

## 5. Selector de limbă în UI?

Da, **unul singur**, deja mutat în Settings:
- Fișier: `src/components/SettingsTab.tsx` (secțiunea `"language"`, cu Popover + căutare + dialog de confirmare).
- Listă de limbi: `src/lib/worldLanguages.ts`.
- API: `setManualLanguage(code)` din `src/i18n/index.ts` (scrie `MANUAL_LANG_KEY` în localStorage și apelează `applyLanguage`).

**Nu există** language selector în header, footer sau pe paginile publice — deci ipoteza „îl mutăm în Settings" e deja realitatea actuală.

## 6. Ce înseamnă „îl eliminăm complet"

Fișiere de atins:
- `src/components/SettingsTab.tsx` — șterge secțiunea `"language"`, entry-ul din meniu, `LanguageConfirmDialog`, `pendingLanguage`, `requestLanguageChange`, `confirmLanguageChange`, importurile `setManualLanguage` / `WORLD_LANGUAGES`.
- `src/i18n/index.ts` — putem păstra `setManualLanguage` exportat (îl folosește doar `SettingsTab`), sau îl ștergem împreună cu constanta `MANUAL_LANG_KEY` și tot codul de „manual override" din `getInitialLanguage` și boot IIFE. Recomand păstrarea funcției dar fără caller — costă zero și lasă ușa deschisă.
- (Opțional) `src/lib/worldLanguages.ts` devine neutilizat.

Impact:
- Limba devine 100% derivată din browser (+ IP fallback). Un utilizator dintr-un browser englez, aflat în România, va vedea RO. Un român care are Chrome setat pe engleză și vrea intenționat UI-ul în engleză **nu mai are cum să forțeze** — și, deoarece `MANUAL_LANG_KEY` există deja în localStorage-urile existente, ar continua să câștige până la ștergerea cache-ului. Ar trebui, la deploy, să curățăm `MANUAL_LANG_KEY` la boot pentru consistență.
- Riscuri: (a) utilizatorii care-și doresc explicit altă limbă decât cea a browserului rămân blocați; (b) pe device-uri partajate / VPN-uri, detecția IP poate greși; (c) suport greu de oferit când un user zice „îmi vreau site-ul în engleză".

## 7. Recomandare

**B. Îl păstrăm în Settings** (situația actuală). Motive strict din cod:

- Detecția automată e deja agresivă și corectă: browser first, IP fallback, cache localStorage — practic 95% din utilizatori nu vor atinge niciodată selectorul.
- Selectorul e deja **ascuns pentru guest** (e în `SettingsTab`, accesibil doar autentificat) — nu poluează landing / homepage.
- Costul menținerii lui e minim (un singur fișier, deja implementat), iar beneficiul e mare pentru edge cases: browsere multilingve, VPN-uri, expați, testare QA, suport clienți.
- Eliminarea completă adaugă frustrare fără câștig tehnic — arhitectura de auto-detecție rulează oricum înainte ca UI-ul să apară.

Dacă totuși vrei simplificare, alternativa rezonabilă este să **păstrezi doar limbile efectiv folosite** (en, ro) în selector, nu întreaga listă `WORLD_LANGUAGES`.

## 8. Cât de pregătit e proiectul pentru multe limbi

- **Foarte pregătit**, într-un mod hibrid neobișnuit:
  - Adăugarea unei limbi noi „statice" cu control complet = adaugi `src/i18n/locales/xx.json` + (opțional) un dicționar text-to-text ca `roText.ts`, îl înregistrezi în `STATIC_RESOURCES` și în `applyLanguage`.
  - Adăugare „zero-effort": orice cod din `COUNTRY_TO_LANGUAGE` funcționează instant — `translate-locale` traduce AI la prima cerere, cache-ul global din Supabase servește toți vizitatorii ulteriori. Deja rulează pentru orice limbă (fr, de, es, it, etc.).
- Sistem centralizat: da — `translate-locale` + tabela server-side de traduceri = single source of truth pentru limbi dinamice; JSON-urile statice pentru en/ro.
- **CLDR / ICU**: nu folosim CLDR-plurals, nici ICU MessageFormat. Interpolarea e cea default a i18next (`{{var}}`), fără pluralizare avansată. Localizarea de date/numere se bazează pe API-uri native (`Intl`), nu pe i18next.

## 9. Plan de implementare recomandat pentru MUZICALIST

Fără schimbări majore de arhitectură — arhitectura actuală e sănătoasă. Ajustări incrementale:

1. **Păstrează selectorul din Settings** exact cum e, dar filtrează `WORLD_LANGUAGES` la un set curat (`en`, `ro` + top 5 piețe țintă). Reduce noise și greutatea listei.
2. **Boot gate mai scurt pentru limbile dinamice**: coboară safety-ul de la 2500ms la 1500ms în `i18n/index.ts` (rețelele IP-geo răspund sub 1s prin `Promise.any`). Rămâne robust, se simte mai instant.
3. **Adaugă un badge „Auto-detected" lângă limba curentă în Settings** (informativ), ca utilizatorul să înțeleagă de ce site-ul e într-o anumită limbă înainte să facă switch manual.
4. **Când user schimbă manual, oferă „Reset to browser default"** care șterge `MANUAL_LANG_KEY` — reușim un UX curat fără a pierde controlul manual.
5. **Ține JSON-urile `en.json` / `ro.json` ca sursă canonică** pentru string-uri noi introduse de dev; folosește `roText.ts` doar pentru literal-e JSX „prinse" de auto-translator (cum funcționează deja). Documentează asta scurt în `docs/`.
6. **Nu introduce ICU/CLDR acum** — nu sunt string-uri cu pluralizare complexă în cod (o singură cheie `genresSelected` cu `{{count}}`, suficient cu i18next standard).
7. **Când adaugi o limbă „prioritară" nouă** (ex: `es`), promov-o din dinamic în static: generează `es.json` + dicționar text-to-text din dump-ul serverului (`translate-locale` cu `dump:true`) → devine sincron, zero flicker.

## Secțiune tehnică

Fișiere-cheie:
- `src/i18n/index.ts` — init i18next, detecție, `setManualLanguage`, `applyLanguage`, `translateTexts(Sync)`, `warmTextCache`, boot gate.
- `src/i18n/locales/{en,ro}.json` — chei statice.
- `src/i18n/roText.ts` — dicționar text-to-text RO (~1855 linii).
- `src/i18n/overrides.ts` — corecții manuale peste orice altceva.
- `src/lib/countryLanguages.ts` — mapare țară → limbă pentru fallback IP.
- `src/lib/worldLanguages.ts` — lista pentru selectorul din Settings.
- `src/components/AutoTranslatePageText.tsx` — auto-translator DOM (MutationObserver + TreeWalker, sync-first + async fetch).
- `src/components/SettingsTab.tsx` — singurul consumer al `setManualLanguage`.
- `supabase/functions/translate-locale/index.ts` — endpoint AI translate + dump cache global.
- `src/lib/brandName.ts` — protejează „Muzicalist"/„MUZICALIST" de mutații de traducere.
