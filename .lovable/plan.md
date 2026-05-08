
# i18n rollout — întreaga aplicație (EN + RO)

Aplicația are deja `react-i18next` configurat (`src/i18n/index.ts`) cu `en.json` și `ro.json`. Multe pagini au deja chei (passwordStrength, etc.), dar majoritatea textului UI este încă hardcodat în engleză. Convertirea completă atinge **80+ fișiere** și mii de string-uri — nu poate fi făcută responsabil într-un singur pas fără să rupă layout-uri, validări și accesibilitate. Propun o livrare în **5 faze**, fiecare verificabilă independent.

## Abordare tehnică

- Folosesc `useTranslation()` din `react-i18next` (deja instalat).
- Chei organizate ierarhic în `en.json` / `ro.json`: `nav.*`, `footer.*`, `home.*`, `auth.*`, `dashboard.*`, `artist.*`, `messages.*`, `forms.*`, `common.*`.
- Adaug un **language switcher** (EN/RO) în:
  - Footer (vizibil mereu)
  - Navigation desktop (pentru guests)
  - Sidebar / settings (pentru utilizatori autentificați)
- Texte dinamice din DB (nume artiști, descrieri, anunțuri) **rămân netraduse** — sunt user-generated.
- Numele de țări/genuri/instrumente: păstrez sursa unică (EN) cu mapping `t('countries.Romania')` doar pentru afișare unde apare în UI static.
- `toast()` messages și erori: traduse prin chei `toasts.*`.
- Plural / interpolare: folosesc sintaxa `i18next` (`{{count}}`, `_plural`).

## Faze

**Faza 1 — Fundație + zone publice high-traffic** (această livrare)
- Language switcher component (Footer + Navigation).
- Traducere completă: `Footer`, `Navigation`, `Home/Index`, `HeroSearchBar`, `AISearchBar`, `About/AboutUs`, `PrivacyPolicy`, `TermsOfService`, `HelpSupport`, `NotFound`.
- Extindere `en.json` / `ro.json` cu toate cheile noi.

**Faza 2 — Auth & Onboarding**
- `Login`, `Register`, `RegisterArtist`, `RegisterUser`, `ResetPassword`, `PlansPricing`, `MyPlan`.

**Faza 3 — Discovery & Listings**
- `Categories`, `CategoryArtists`, `Countries`, `CountryArtists`, `Counties`, `CountyArtists`, `CountySpecializationArtists`, `AllArtists`, `Leaderboard`, `Search`, `Announcements`, `Feed`.
- Componente: `ArtistCard`, `SimpleArtistCard`, `CategoryCard`, `CountryFlagIcon`, filtre, etc.

**Faza 4 — Dashboards & Profil**
- `Dashboard` (artist), `UserDashboard`, `ArtistProfile`, `ArtistAnalytics`, `Notifications`, `Messages`.
- Componente grele: `EditContentDialog`, `BookedEventsList`, `SettingsTab`, `PricingEntriesEditor`, `GenrePickerDialog`, `InstrumentSelector`, `LocationAutocomplete`, calendar booking flow.

**Faza 5 — Admin & polish**
- `AdminDashboard`, `ReportDialog`, toast messages rămase, mesaje de validare formulare, aria-labels.

## Ce primești în această livrare (Faza 1)

```text
src/
├── components/
│   ├── LanguageSwitcher.tsx       (NOU)
│   ├── Footer.tsx                 (i18n)
│   ├── Navigation.tsx             (i18n + switcher)
│   ├── HeroSearchBar.tsx          (i18n)
│   └── AISearchBar.tsx            (i18n)
├── pages/
│   ├── Index.tsx / Home.tsx       (i18n)
│   ├── AboutUs.tsx                (i18n)
│   ├── PrivacyPolicy.tsx          (i18n)
│   ├── TermsOfService.tsx         (i18n)
│   ├── HelpSupport.tsx            (i18n)
│   └── NotFound.tsx               (i18n)
└── i18n/locales/
    ├── en.json                    (extins)
    └── ro.json                    (extins)
```

## Note importante

- **Acesta este un efort multi-iterație.** După ce aprobi planul, livrez Faza 1 într-un singur mesaj. Faza 2–5 le execut în mesaje separate la cererea ta, ca să poți testa și valida vizual fiecare lot fără regresii ascunse.
- **Texte din DB nu se traduc** (descrieri artiști, mesaje chat, recenzii etc.).
- **Email-urile transactionale** și template-urile Supabase auth nu intră în i18n client-side; sunt separate și pot fi traduse ulterior dacă vrei.
- Confirmă dacă vrei să încep direct cu **Faza 1**, sau preferi alt ordin (de ex. începem cu Dashboard).
