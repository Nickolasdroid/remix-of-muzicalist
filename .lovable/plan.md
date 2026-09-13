# Official Rules page

## Goal
Add a public, localized `/rules` page that presents Muzicalist’s artist standards, beginning with the profile-photo rule, without changing registration, uploads, moderation, or any profile behavior.

## Implementation
- Create a responsive Rules page using the existing dark surfaces, gold accent, typography, icons, navigation, footer, and authenticated sidebar spacing.
- Add a small reusable rule-section structure so future standards can be appended without redesigning the page.
- Present Rule 1 prominently with:
  - the required introduction and guiding principle;
  - recommended examples for Singer, DJ, Instrumentalist, Band, and other categories;
  - a concise “Avoid” section, including the individual-versus-band group-photo distinction;
  - “Why does this matter?” context;
  - a clear standards notice stating that recommendations are not automatic enforcement and only profile-photo presence is currently mandatory at registration.
- Add complete English and natural Romanian copy through the existing localization dictionaries.
- Register and preload the public `/rules` route in the existing router.
- Add “Rules” to the existing secondary navigation:
  - authenticated desktop “More” menu;
  - authenticated mobile drawer;
  - public footer informational links;
  - Help Center useful links, so guests can also discover it without adding a crowded primary item.
- Add page-specific title, description, canonical, and social metadata using the shared SEO component.

## Verification
- Open `/rules` directly and through each added navigation link.
- Verify English and Romanian content.
- Check desktop, tablet, and mobile layouts for readable wrapping and no overflow.
- Confirm guest and authenticated navigation patterns remain intact.
- Run the production build and inspect runtime errors.
- Confirm no registration, image upload/storage/viewer, search, cards, leaderboard, feed, subscriptions, or visibility code changed.
