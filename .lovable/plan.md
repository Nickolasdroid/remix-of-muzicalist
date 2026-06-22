# Switch from 30-day cooldown to billing-period reset

## Goal
Eliminate the rolling 30-day per-slot cooldown. Limits become **per-billing-period** counters that reset automatically at the start of each new billing cycle. Limits per plan stay unchanged (Standard: 15 posts / 5 announcements / 2 promotions; Premium: 30 / 10 / 5).

## New rules
- Counters tracked: `postsUsedThisPeriod`, `announcementsUsedThisPeriod`, `promotionsUsedThisPeriod`.
- Period boundary derived from `profiles.subscription_current_period_end` and `billing` (`monthly` → period_start = end − 1 month; `yearly` → end − 1 year). For Free or missing subscription, no quota is available anyway (limits are 0).
- Upgrade mid-period: new limit applies immediately, used count is preserved (no reset, no slot loss).
- Downgrade: scheduled at next renewal (already handled by Stripe + webhook). New limits apply at the next period reset.
- Annual plans grant the **same** limits as monthly — only the billing cadence/price differ.

## Implementation

### 1. New helper `src/lib/billingPeriod.ts`
Exposes `getPeriodStart(profile)` returning a `Date` (or `null` for Free). Logic:
- If `plan` is `Free` or no `subscription_current_period_end` → `null`.
- Else parse `subscription_current_period_end`; subtract 1 month (`billing === 'monthly'` or unknown) or 1 year (`billing === 'yearly'`).
- Fallback when end date is in the past or missing: use start of current calendar month so the user is never locked out.

### 2. `src/pages/Dashboard.tsx`
- Remove `SLOT_COOLDOWN_MS` and `activeConsumedSlots` filtering.
- Compute `periodStart = getPeriodStart(profile)`.
- Filter `consumedSlots` by `consumed_at >= periodStart` instead of by 30-day window. Keep the `consumed_ad_slots` table as the per-period usage log (no schema change).
- Update `loadAnnouncements` query: change `.gte('consumed_at', cutoffIso)` to use `periodStart` (fall back to a 1-year horizon if null, to keep the query bounded).
- Update toast messages and the in-dialog hint (line 2694 "Slot held 30 days") to "Resets each billing cycle".
- Keep insert behavior on create, but **also delete the corresponding row when the user deletes their post/announcement/promotion** so deletions free up a slot in the current period (matches the new "monthly quota" mental model).

### 3. UI copy / components
- `src/components/AdSlotInfoButton.tsx`: rewrite the popover to describe monthly reset ("Each billing period you get N posts / N announcements / N promotions. Counters reset automatically when your subscription renews.").
- `src/components/OverLimitBanner.tsx`: replace "released 30 days after creation" with "your counters reset at the next billing cycle (<date>)" — accept an optional `resetDate` prop.
- `src/pages/PlansPricing.tsx`, `src/pages/HelpSupport.tsx`, `src/pages/TermsOfService.tsx`, `src/i18n/locales/en.json` and `ro.json`: update wording from "30 days" cooldown to "per month / per billing cycle, resets at renewal".
- Plan-pricing strings standardized to: "15 posts/month", "5 announcements/month", "2 promotions/month" (and 30/10/5 for Premium).

### 4. Backend / DB
- No schema migration needed; `consumed_ad_slots` keeps acting as the usage log, just queried by billing-period start instead of a fixed 30-day window.
- `admin-delete-user` already cleans the table — no change.
- No changes to Stripe webhook (`subscription_current_period_end` is already maintained).

### 5. What stays the same
- Plan limit values in `src/lib/planLimits.ts` (15/5/2 and 30/10/5).
- Gallery image/video limits (separate system, not slot-based).
- 15-day promotion validity (content lifetime is unrelated to quota counting).

## Out of scope
- No changes to subscription pricing, Stripe price IDs, or annual-vs-monthly benefits (already identical).
- No retroactive reset of existing usage rows — they will naturally fall out of the current period window.
