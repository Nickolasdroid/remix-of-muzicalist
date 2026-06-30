## Obiectiv
Layout hibrid pe tabletă (768–1279px): se păstrează experiența desktop (sidebar/top header, fără bottom nav mobil), dar cu spacing, fonturi, grid-uri și componente reglate pentru lățimi medii. Mobil (<768) și desktop mare (≥1280) rămân neschimbate.

## Probleme observate
Am surprins screenshot-uri la 768 / 820 / 1024 pe paginile publice. Cele mai vizibile:
1. **Sidebar 256px** mănâncă mult din 768–900px → conținutul rămas e ~510–640px și grid-urile de 3–4 coloane se înghesuie sau debordează.
2. **Hero (Home)** — titlu uriaș `text-6xl/7xl` la `md:`, padding mare, search bar prea lat pentru spațiu rămas.
3. **Countries / Categories / Counties** — carduri pătrate la 3+ coloane sunt prea mici pe tabletă; lipsește un breakpoint intermediar (`md:grid-cols-2` → `xl:grid-cols-3/4`).
4. **Feed / Announcements** — coloana de conținut e prea îngustă la 820px cu sidebar; cardurile/imaginile arată comprimat.
5. **Plans & Pricing** — 3 coloane forțate `md:grid-cols-3` la 768–900px → carduri prea înguste cu text spart.
6. **Register / Login / RegisterArtist / RegisterUser** — containere `max-w-md` ok, dar secțiunile cu pași/wizards rămân întinse stângaci.
7. **Dashboard-uri (User/Artist) + Settings + Messages + BookingRequests** — tab-urile, formularele și grid-urile media nu au breakpoint pentru tabletă; multe folosesc `md:grid-cols-3` direct.
8. **CommunitySections** — mockup-ul phone + textul la 768–900 se înghesuie; tranziția mobile/desktop e bruscă.
9. **Cards artist (ArtistCard, SimpleArtistCard, ArtistProfileCard)** — grid-ul de rezultate sare direct de la 1→3 coloane.
10. **Profil artist** — header, tabs, media gallery, pricing — toate nestea la `md:` fără tweak pentru zona îngustă disponibilă lângă sidebar.

## Strategie generală (aplicată consistent)
- **Breakpoint nou de lucru:** folosim `lg` (1024) și `xl` (1280) ca pivoți pentru densitate, nu doar `md`.
- **Sidebar:** rămâne 256px de la `md:`, dar conținutul principal capătă padding redus pe `md/lg` (`md:px-4 lg:px-6 xl:px-8` în loc de `md:px-8`).
- **Grid-uri carduri:** pattern standard `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` (în loc de salturi 1→3 la `md:`).
- **Tipografie hero:** introducem treaptă `lg:` pentru titluri (`md:text-4xl lg:text-5xl xl:text-7xl`) în loc de `md:text-6xl lg:text-7xl`.
- **Plans pricing:** `md:grid-cols-1 lg:grid-cols-3` (3 coloane doar de la 1024px în sus).
- **Tabs / forms în dashboard:** `md:grid-cols-2 xl:grid-cols-3` în loc de `md:grid-cols-3`.
- **Spacing vertical:** `md:py-12 lg:py-20` în loc de `md:py-20` peste tot unde sunt secțiuni mari.

## Fișiere modificate (lista țintită)
**Layout & nav**
- `src/components/Navigation.tsx` — sidebar w-64 rămâne, dar verificăm overflow & main content padding.
- `src/components/Footer.tsx` — grid `md:grid-cols-4` → `md:grid-cols-2 lg:grid-cols-4`.

**Home & secțiuni landing**
- `src/pages/Home.tsx` — hero typography și paddings cu treaptă `lg:`.
- `src/components/HeroSearchBar.tsx` — layout flex compact la `md`, expandat la `lg`.
- `src/components/AISearchBar.tsx`, `AISearchShowcase.tsx` — width și inputs.
- `src/components/CommunitySections.tsx` — păstrăm carouselul până la `lg:` în loc de `md:` (mockup-ul phone arată prost între 768–1024).
- `src/components/DiscoverArtistsSection.tsx`, `TrendingArtistsSection.tsx`, `LeaderboardPreviewSection.tsx` — grid-uri carduri.

**Pagini publice**
- `src/pages/Countries.tsx`, `Counties.tsx`, `Categories.tsx`, `CountryArtists.tsx`, `CountyArtists.tsx`, `CountySpecializationArtists.tsx`, `CategoryArtists.tsx`, `AllArtists.tsx` — grid carduri pe pattern standard.
- `src/components/CategoryCard.tsx`, `ArtistCard.tsx`, `SimpleArtistCard.tsx`, `ArtistProfileCard.tsx` — text/padding intern.
- `src/pages/Feed.tsx`, `Announcements.tsx` — coloana centrală cu `max-w` adaptat, sidebar drept ascuns sub `xl:`.

**Auth & plans**
- `src/pages/Register.tsx`, `RegisterArtist.tsx`, `RegisterUser.tsx`, `Login.tsx`, `ResetPassword.tsx` — containere centrate, paddings.
- `src/pages/PlansPricing.tsx`, `MyPlan.tsx` — grid-uri pricing.

**Zone logate**
- `src/pages/UserDashboard.tsx`, `ArtistAnalytics.tsx` — taburi & grids.
- `src/components/SettingsTab.tsx` — formularul 2 coloane: `md:grid-cols-1 lg:grid-cols-2`.
- `src/pages/Messages.tsx` — split conversation list / chat: split de la `lg:` în loc de `md:`.
- `src/pages/BookingRequests.tsx`, `BookedEventsList.tsx`, `Notifications.tsx` — listare cu padding redus.
- `src/pages/ArtistProfile.tsx` + `ArtistProfileCard.tsx` — header, tabs media, pricing.
- `src/pages/BookArtist.tsx` — formular calendar pe tabletă.
- `src/pages/Search.tsx` — filtre + rezultate.
- `src/pages/Leaderboard.tsx` — tabel + podium.
- `src/pages/HelpSupport.tsx`, `About.tsx`, `AboutUs.tsx`, `PrivacyPolicy.tsx`, `TermsOfService.tsx` — typography & paddings.

**Global**
- `src/index.css` — adăugăm un mic block `@media (min-width: 768px) and (max-width: 1279px)` pentru tweaks neacoperite de utilități (ex. fix de spațiere container).

## QA
După modificări, captez screenshot-uri Playwright la **768, 834 (iPad), 1024 (iPad Pro), 1180 (iPad Pro 11")** pentru aceleași pagini și pentru o rută logată (dacă sesiunea e disponibilă). Verific vizual fiecare și iterez până e curat.

## În afara scopului
- Fără modificări de business logic, queries, RLS, sau funcționalitate.
- Fără re-design vizual / schimbare paletă, fonturi sau identitate.
- Fără modificări la fluxurile mobile (<768) sau desktop ≥1280 deja funcționale.

## Notă cost
Scope-ul atinge ~35 fișiere. Voi face edit-urile în batch-uri paralele și voi grupa screenshot-urile QA pentru a minimiza tool calls.
