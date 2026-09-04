# Dedicated post creation workspace

## Goal
Replace the artist Dashboard’s small “Add post” dialog with a localized, responsive full-page composer while preserving the current post mutation, media upload, quota, entitlement, and feed behavior.

## User experience
- Add a protected `/dashboard/posts/new` page and route every Posts “Add” entry point there, including the existing `?new=1` shortcut.
- Keep the artist navigation, then present a clear “Back to Posts” action, page title/subtitle, and the authoritative remaining-post quota with renewal/30-day information.
- Desktop/tablet: balanced composer and live-preview columns. Mobile: header, quota, composer, media, preview, and actions in one natural vertical flow.
- Build a spacious composer surface with the existing 200-character limit, live counter, photo/video selectors, upload progress, selected-media preview, remove, and replace actions.
- Render the live result with the existing `FeedPostCard` so avatar, artist name/type, timestamp, copy, and media match the real Feed. Show a refined localized empty state until text or media exists.
- Provide “Cancel” and gold “Publish post” actions; Cancel returns to Dashboard → Posts, and Publish remains disabled under the same existing validation rules.

## Implementation
- Create a focused post composer page that loads the signed-in artist/profile and current server entitlements, redirects non-artists exactly as the Dashboard does, and calculates remaining slots as `max(server limit - authoritative usage, 0)`.
- Move the existing post-only state and handlers out of `Dashboard.tsx` into the dedicated page without changing their storage bucket/path, 500 MB video validation, upload helper, post insert fields, legacy usage recording, toasts, or server-side enforcement.
- Remove only the obsolete post-creation dialog and its post-only imports/state from the Dashboard. Leave announcement creation and all post listing/edit/promote/delete behavior unchanged.
- Update Dashboard and Feed entry points to navigate to the new page, preserving the current return target `/dashboard?tab=profile&section=posts`.
- Add English and Romanian strings for the page header, subtitle, empty preview, media controls, quota display, validation feedback, and actions using the existing localization structure.
- Use existing semantic dark/gold tokens, Button/Input/Textarea/Progress controls, rounded-lg surfaces, and the current responsive navigation conventions; no new visual token or backend/schema work.

## Verification
- Confirm Dashboard → Posts → Add and the Feed shortcut open the dedicated page rather than a dialog.
- Verify text editing/counter, photo and video upload previews, remove/replace controls, empty/live `FeedPostCard` preview, Cancel, disabled/enabled publish states, and successful return to Posts after publishing.
- Confirm displayed quota uses authoritative remaining slots rather than the raw plan allowance and that deleting content does not alter the rolling 30-day event-based usage behavior.
- Exercise English and Romanian at desktop (two columns), tablet, and mobile (stacked) widths, checking layout, media framing, and navigation.
- Run the project test/build command, inspect browser console/runtime/network errors, and avoid consuming a real artist’s non-restorable 30-day slot during automated verification unless an isolated test identity is available.

## Out of scope
- No changes to database schema, server functions/triggers, post limits, entitlement tiers, billing periods, slot regeneration/deletion rules, visibility, Feed rendering, media providers, storage configuration, announcements, promotions, or gallery behavior.
