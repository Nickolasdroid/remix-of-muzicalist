# Redesign Create Announcement modal

## Goal
Make the artist announcement composer compact and visually consistent with the shared Create Post composer, without changing announcement behavior or quota rules.

## Changes
- Refine the existing shared modal shell usage for the announcement form to match the post composer’s width, header, badges, gold action, borders, and compact spacing.
- Move the authoritative remaining-announcements badge and 7-day validity badge into the header, with the existing shared quota information control beside the remaining count.
- Make the 200-character description field compact by default and auto-growing up to a capped height with internal scrolling.
- Present Location, Event date, and Budget in one clearly separated event-details section with consistent labels, optional indicators, heights, typography, and responsive layout.
- Keep worldwide location search, date constraints, currency/budget behavior, validation, publishing, and loading/disabled states unchanged.
- Update English and Romanian translations for the requested title, labels, placeholders, and exact 30-day quota explanation.

## Verification
- Confirm the displayed count still comes from authoritative entitlements for Standard and Premium accounts.
- Confirm deletion and 30-day slot regeneration code remains untouched.
- Check the tooltip and both languages.
- Verify desktop and mobile layout, then run the project checks and inspect runtime diagnostics.

## Technical details
Only presentation code in the Dashboard announcement dialog, the shared modal shell where needed, and locale strings will change. No database, migration, billing, entitlement, expiration, upload, or announcement CRUD logic will be modified.
