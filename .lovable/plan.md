## Change
On `src/pages/ResetPassword.tsx`, remove the entire left panel (concert image + gradient overlays + heading) and switch the layout to a single centered column matching the Login page style.

## Details
- Drop the left `<div>` (lines 134-158) and the `artistOnboardingBg` import.
- Change the root container from a two-column flex (`md:flex-row`, `md:w-1/2`) to a single full-width centered column.
- Keep the logo link top-left, the form card, and the "Back to login" link unchanged.
- Both modes (`request` for email entry and `update` for new password) keep the same heading/subtext, now shown above the form on all screen sizes.
