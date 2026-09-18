# Compact, identity-safe artist review modal

## What will change
- Remove the visible reviewer name and email fields from the existing artist review dialog.
- Keep the current 1–5 star control, optional review textarea, 100-character counter, and submit action.
- Tighten spacing so the dialog contains only its title, subtitle, rating, optional review, and submit button on desktop and mobile.
- Add localized review-dialog labels and messages in English and Romanian, while keeping the artist name untranslated.

## Secure submission
- Keep the existing `reviews` table and review loading/display flow.
- Add a database-side insert guard on reviews that derives the reviewer ID from the authenticated session and resolves the reviewer name/email from the account profile/session.
- Ignore any client-supplied reviewer identity values, reject unauthenticated inserts, and retain the existing artist/rating/comment associations and one-review constraint.
- Update the existing client submission to send only artist, rating, and optional text; identity fields will be populated by the database.

## Verification
- Confirm the dialog has no name/email controls or leftover spacing.
- Verify rating selection, 100-character limit/counter, translated English/Romanian text, and authenticated submission.
- Check desktop and mobile layouts and confirm the preview builds without errors.
