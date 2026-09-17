# Public header authentication actions

## Goal
Replace the guest-only profile icon with two compact, localized actions while preserving the existing header height, routes, and authentication flows.

## Implementation
- Update only the unauthenticated desktop and mobile branches in the shared navigation header.
- Add a compact secondary login action linking to `/login` and a slightly emphasized registration action linking to `/register`.
- Use full desktop labels and shorter mobile labels through the existing translation files:
  - Romanian: `Autentificare` / `Înscrie-te`; mobile `Intră` / `Înscrie-te`
  - English: `Log in` / `Join`; mobile `Log in` / `Join`
- Reuse the existing button design component and semantic theme colors for borders, surfaces, text, focus, hover, and active states.
- Keep the logo, header heights, authenticated navigation, sidebars, routes, and auth logic unchanged.
- Tighten mobile spacing and button padding at narrow widths so the group remains within the header without overlap.

## Verification
- Check guest header rendering and links at desktop, tablet, standard mobile, and narrow mobile widths.
- Verify both English and Romanian labels.
- Confirm `/login` and `/register` destinations and ensure the existing User/Artist choice remains on registration.
- Confirm authenticated header behavior is unchanged and the project builds cleanly.
