## Problem

`/register/artist` shows a black/blank screen. Console shows **React error #310** ("Rendered more hooks than during the previous render"), originating from `RegisterArtist`.

Root cause is a Rules of Hooks violation in `src/pages/RegisterArtist.tsx`:

- Line 123: `if (authChecking) return null;` — early return before all hooks have run.
- Line 349: `const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);` — a `useState` declared *after* that early return, in the middle of the component body.

On the first render `authChecking` is `true`, so the component returns before reaching that `useState`. After the auth check resolves, `authChecking` becomes `false`, the component renders fully, and React sees an extra hook compared to the first render → crash → blank page.

This started crashing recently because that `checkoutLoading` state was added during the Stripe checkout work without being hoisted to the top with the other `useState` calls.

## Fix

Single-file change in `src/pages/RegisterArtist.tsx`:

1. Remove the misplaced `const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);` from line 349.
2. Add it to the top hooks block (alongside the other `useState` declarations around lines 34–61), so all hooks run on every render, before any conditional `return`.

No behavior change — only the declaration site moves. `handlePlanSelect` continues to use the same setter.

## Verification

After the fix:
- Navigate to `https://muzicalist.com/register/artist` (and the preview equivalent).
- Page renders the registration flow instead of a blank screen.
- No React #310 error in the console.
- Plan selection step still triggers Stripe checkout via `startCheckout` and the loading state still updates.

## Notes

- No backend, RLS, or Stripe changes required.
- Unrelated to the previous Stripe price ID work; that fix stays as is.
