## Goal

Make subscription upgrade/downgrade behavior explicit and user-visible for slot-based resources (Announcements, Posts, Promotions). Existing content must never be touched on downgrade; only new creation is gated until consumed slots expire (30-day cooldown).

## Current state (no change needed)

- Slots are tracked in `consumed_ad_slots` per creation, released after 30 days regardless of deletion.
- Counters in `Dashboard.tsx` already use `consumed_ad_slots` count vs `getAdLimit / getPostLimit / getPromotionLimit` from `planLimits.ts`.
- Creation guards already use `usedSlots >= limit` (announcements line 806, promotions 909, posts 949).
- Therefore upgrade automatically unlocks new capacity, and downgrade automatically leaves existing content alone — no content/DB mutation required.

## What to add

### 1. `src/lib/planLimits.ts`
Add a small helper:
- `isOverLimit(used, plan, kind)` returning boolean
- `getOverLimitMessage(kind)` returning the standard warning copy (i18n-ready string).

### 2. New component `src/components/OverLimitBanner.tsx`
Shared warning card shown when `used > limit`. Props: `kind` ("announcements" | "posts" | "promotions"), `used`, `limit`. Uses `bg-destructive/10 border-destructive/40 text-destructive-foreground`, `rounded-lg`, with an `AlertTriangle` icon. Copy:

> "Your current subscription allows fewer slots than you are currently using. Your existing content remains active, but you cannot create new ones until enough slots are automatically released."

### 3. `src/pages/Dashboard.tsx`
For each of the three tabs (posts, announcements, promotions section inside posts tab):
- Render `<OverLimitBanner>` above the list when `used > limit`.
- When over limit, render the counter in destructive color (e.g. `text-destructive`) instead of `text-foreground`. Keep the `X/Y` format.
- The existing creation buttons are already disabled by `used >= limit` checks — no logic change.

### 4. `src/pages/MyPlan.tsx`
Add an info block under the billing toggle (or under the plan grid) explaining:
- Upgrades take effect immediately and increase your available slots.
- Downgrades never delete or hide existing content.
- If your usage exceeds the new plan limits, you simply cannot create new content in that category until occupied slots expire naturally (30 days after creation).

Also show an `<OverLimitBanner>` summary at the top of MyPlan when the user is currently over limit on any of the three categories (fetch counts via the same `consumed_ad_slots` query).

### 5. `src/pages/PlansPricing.tsx`
Add the same short explanation paragraph in the comparison/FAQ area so prospective subscribers see the rule before purchasing.

## Out of scope / explicitly not doing

- No DB migrations. No changes to `consumed_ad_slots`, RLS, or webhook handlers.
- No content deletion, hiding, unpublishing, or auto-unpromote on downgrade.
- No backfill — historical content remains visible exactly as it is.
- Stripe checkout/portal flow unchanged.

## Files touched

- `src/lib/planLimits.ts` (add helpers)
- `src/components/OverLimitBanner.tsx` (new)
- `src/pages/Dashboard.tsx` (banners + destructive counter color)
- `src/pages/MyPlan.tsx` (explanation block + optional summary banner)
- `src/pages/PlansPricing.tsx` (explanation paragraph)
