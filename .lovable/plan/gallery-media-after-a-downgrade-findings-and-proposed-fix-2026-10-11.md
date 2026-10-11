# Gallery media after a downgrade: findings and proposed fix

## Findings (verified in code and database)

**Limits** match the intended numbers in both places that define them (`plan_limits()` in the database and `planLimits.ts` in the app):
- Free: 5 images, 0 videos
- Standard: 10 images, 3 videos
- Premium: 15 images, 5 videos

**Nothing is ever deleted on a downgrade.** No downgrade, cancellation or expiry code touches `gallery_items` or the stored files. Gallery rows and files are removed only when:
- the artist deletes an item themselves, or
- the account is deleted.

The files sit in the public `avatars` storage folder. Their direct links stay reachable by anyone who has them.

**Uploads:** the database check `enforce_gallery_quota` blocks new uploads over the limit, counting all existing items. An artist over the limit can't upload until they are back under it.

**Dashboard (artist's own view):** shows every item, none hidden, and each can still be deleted. There is no reordering or editing of gallery items for any plan.

**Public profile: this contradicts the stated rule.** The code comment and `computeGalleryVisibility()` say existing media stays public after a downgrade. However, `ArtistProfile.tsx` (`getImages` / `getVideos`) still trims the list to the current plan's limit, keeping the oldest items first. If the plan allows 0 videos, the whole Videos section is hidden.

| Scenario | Stored | Shown publicly |
|---|---|---|
| A: Premium to Standard (12 img, 4 vid) | all 16 | oldest 10 images, oldest 3 videos |
| B: Premium to Free (12 img, 4 vid) | all 16 | oldest 5 images, no videos section |
| C: Standard to Free (8 img, 2 vid) | all 10 | oldest 5 images, no videos section |

**Upgrading again:** hidden items reappear automatically because nothing was changed. The cut is recalculated from the plan each time the page loads.

**Cancellation, expiry and payment problems:** the payment webhook sets the plan to Free as soon as the status is anything other than active or trialing. That includes `past_due`, so the 7-day grace period the database expects for `past_due` never applies. A cancellation set to end at period end stays paid until the period actually ends.

**Not verified:**
- Live behaviour on screen.
- Whether Stripe sends `past_due` before `canceled` for this account setup.

## Problems found

1. The public profile hides extra media after a downgrade, contrary to the "existing content stays public" rule already applied to posts and announcements.
2. It hides it based on the stored plan, not the effective plan.
3. `past_due` drops an artist to Free immediately, so the 7-day grace period in the database never takes effect.
4. Hidden items are not private. Their file links still work, so "hidden" here means only "not listed".

## Proposed fix (needs your approval)

**Recommended:**
- Make the public profile show every gallery item, matching the Dashboard and the stated rule.
- Keep upload limits exactly as they are.
- Show the Videos section whenever the artist has videos.
- Change the payment webhook to keep the paid plan during `past_due`, so the existing 7-day grace period actually applies.

No data, files or limits change.

**Alternative:** keep hiding extra media publicly, but base it on the effective plan and state the rule on My Plan.

## Technical details

- `src/pages/ArtistProfile.tsx`: remove the `.slice(0, getImageLimit/getVideoLimit)` in `getImages`/`getVideos`, and replace `getVideoLimit(artist.plan) > 0` with "has videos".
- `supabase/functions/stripe-webhook/index.ts`: treat `past_due` like active when setting `plan` (both places where `isActive` is calculated), leaving `effective_plan()` to apply the grace period.
- No migration and no storage changes.
