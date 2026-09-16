# Standardize artist-card review display

## Goal
Use one compact, localized review pill everywhere an artist card shows both rating and review count, without changing card layouts or review data logic.

## Implementation
- Refine the existing shared artist-card status component into a compact pill: gold star and rating, centered dot, localized review count.
- Preserve the current new-artist empty state when no reviews exist; never invent a rating.
- Reuse the shared pill in artist discovery cards, location/category/search cards, and leaderboard artist cards that currently show rating and count separately.
- Keep images, names, badges, card dimensions, ranking logic, queries, and calculations unchanged.
- Add English and Romanian review-label translations through the existing localization dictionaries.

## Verification
- Check representative artist cards on desktop and mobile for no wrapping or overflow.
- Verify reviewed and no-review states, English and Romanian labels, and real values.
- Confirm the app builds successfully and the change is limited to review presentation.
