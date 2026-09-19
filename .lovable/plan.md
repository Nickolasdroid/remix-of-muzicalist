# Shared Posts list/grid switcher

## Goal
Add one reusable view switcher to the existing Posts heading on both the public artist profile and the artist dashboard. List remains the default and preserves the current post cards and behavior unchanged.

## Implementation
- Add a shared Posts view module containing:
  - a compact icon-only List/Grid switcher using existing controls, tooltips, semantic colors, and localized accessible labels;
  - shared session-scoped view state, defaulting to List;
  - a responsive three-column square grid with small gaps at every supported width;
  - optimized image thumbnails, lightweight video thumbnails, and a designed text-only tile with a text preview and subtle type indicator.
- Normalize the already-fetched posts/promotions into lightweight grid item metadata without introducing new fetching or changing visibility, security, quotas, ordering, or deletion rules.
- Place the shared switcher in the existing Posts heading row on:
  - Artist public profile → Posts;
  - Artist Dashboard → Profile → Posts, alongside the existing quota and Add controls.
- Keep each page’s current list rendering byte-for-byte equivalent in behavior and show it whenever List is selected.
- Add a shared full-post dialog opened from every grid tile. Each page will render its existing complete post card inside that dialog, preserving author details, text, media, likes, comments, sharing, reporting, promotion state, mentions, and owner management actions.
- Keep media-preview clicks inside the full post working as they do today; clicking a grid tile itself opens the complete post rather than the media viewer.
- Add English and Romanian labels for view selection and post-type accessibility.

## Technical details
- No database or backend changes.
- No second post query or duplicated post state.
- Public storage images use the existing transformed-image utility for grid-sized thumbnails; originals remain untouched for full post/media viewing.
- Video tiles use native metadata/preload behavior without downloading full video content where avoidable; embedded/direct media receives an intentional dark tile when no image thumbnail exists.
- Session preference uses browser session storage only and falls back safely to List.
- Grid items are keyboard accessible, retain stable square dimensions, and never introduce horizontal scrolling.

## Verification
- Verify public profile and dashboard in List and Grid modes.
- Verify desktop, tablet, standard mobile, and narrow mobile layouts remain exactly three columns where required.
- Verify image, video, and text-only indicators and optimized thumbnail URLs.
- Verify opening a tile exposes the existing complete post interactions and dashboard management actions.
- Verify List remains the default in a fresh session and selection persists during the session.
- Check build and runtime logs after implementation.
