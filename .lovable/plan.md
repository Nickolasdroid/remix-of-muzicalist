# Subscription Entitlements: One Server-Side Source of Truth

Goal: subscription plans control what an account can **create now**; everything already created stays live, editable and public. Enforcement moves from the browser into the database.

## 1. Effective plan (authoritative)

New database function `public.effective_plan(user_id)` returns `Free | Standard | Premium` from the profile's plan plus Stripe status:

- `active`, `trialing` -> paid plan
- `past_due` -> paid plan until the paid period end **+ 7 days**, then Free
- `unpaid`, `canceled`, `incomplete_expired`, anything else -> Free
- cancel_at_period_end -> paid until the period actually ends (unchanged)
- Admin accounts are treated as unlimited, as today

Frontend mirrors this in `src/lib/planLimits.ts` via a single `resolveEffectivePlan(profile)` helper; the existing unused `getEffectivePlan` in `stripePrices.ts` is folded into it so there is only one interpretation of Stripe status in the UI.

## 2. Limits table (one definition)

A database function `public.plan_limits(plan)` returns posts, announcements, post promotions, announcement promotions, gallery images, gallery videos, pricing entries and social links for each tier, matching the agreed numbers (Free 0/0/0/0/5/0/0/1, Standard 15/5/2/1/10/3/3/5, Premium 30/10/5/3/15/5/3/5). Promotion RPCs stop hard-coding their own numbers and read from it. `src/lib/planLimits.ts` keeps the same numbers for UI only and is documented as the mirror.

## 3. Creation quotas enforced in the database

- `BEFORE INSERT` trigger on `posts`: counts the owner's posts created since `billing_period_start(owner)` and rejects when the effective plan's post limit is reached (Free rejects immediately).
- `BEFORE INSERT` trigger on `announcements`: same, against the announcement limit.
- Counts come from the real `posts` / `announcements` rows in the current billing period — never from a client-writable counter.
- New `BEFORE INSERT` triggers on `gallery_items` (images vs videos separately) and `pricing_entries` apply the same pattern against total existing rows.
- Errors are raised with stable codes so the UI can show friendly text instead of a raw Postgres message.

Effect: a direct API insert from a Free account is rejected server-side.

## 4. consumed_ad_slots

Stops being the source of truth for post/announcement usage (that is now derived from real content). Historical rows are kept untouched. Client INSERT/DELETE rights on the table are revoked so only the promotion RPCs (SECURITY DEFINER) can write promotion slots; promotion quotas continue to be counted from those rows, now server-only.

## 5. Existing content stays

- No migration deletes or edits any post, announcement, promotion, like, comment, gallery item or media file.
- Public artist profile: Posts and Announcements tabs are shown when the artist **has** posts/announcements, no longer gated on `canPost(plan)`. Creation controls stay gated.
- Gallery: excess media above the new plan limit is shown publicly (the hide-newest rule in `computeGalleryVisibility` is retired for display; limits only block new uploads).
- Active promotions run to their original `promoted_until` after a downgrade. Existing protection triggers are untouched, as is `protect_announcement_premium`.

## 6. Usage display

Dashboard counters switch to "created this billing period / plan limit" derived from actual content dates, so a downgraded artist sees `0/15` for the new period instead of a stale `15/0`. A short explanatory line appears when historical content exceeds the plan limit (the existing `OverLimitBanner` copy is adjusted to the new meaning).

## 7. Error messages

Creation failures map to localized messages such as "You've reached your monthly post limit." or "Posts are available with a Standard or Premium plan." — no raw database errors surfaced.

## Technical notes

New migration adds: `effective_plan()`, `plan_limits()`, insert-guard triggers on `posts`, `announcements`, `gallery_items`, `pricing_entries`, updated `promote_post` / `promote_announcement` to use `effective_plan` + `plan_limits`, and revoked client write grants on `consumed_ad_slots`. All functions are `SECURITY DEFINER` with `SET search_path = public` and avoid self-referential RLS queries.

Frontend files touched: `src/lib/planLimits.ts`, `src/lib/stripePrices.ts`, `src/lib/billingPeriod.ts` (reuse only), `src/pages/Dashboard.tsx`, `src/pages/ArtistProfile.tsx`, `src/components/OverLimitBanner.tsx`, plus the components reading raw `profile.plan` (`BookArtist.tsx`, `AllArtists.tsx`, promotion dialogs) so they consume the effective plan.

Verification after implementation: direct API insert attempts as Free/over-limit accounts, quota boundary checks per tier, downgrade scenarios confirming content and promotions survive, and a Free artist's public profile still showing historical posts.
