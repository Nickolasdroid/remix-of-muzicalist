# Scalable Rules Center

## Goal
Rebuild the existing public Rules page as a scalable, localized Rules Center that mirrors the Help Center’s category-and-accordion structure without changing the Help Center itself or introducing new enforcement.

## Implementation
- Replace the current single-topic cards with six data-driven rule categories, each containing four individually expandable rules.
- Match the Help Center’s centered header, icon treatment, readable content width, stacked category cards, typography, borders, spacing, accordion dividers, chevrons, and responsive behavior.
- Keep the existing guest/authenticated navigation behavior and public `/rules` route unchanged.
- Move all existing profile-photo guidance into **Artist Profile → Profile photo**, including clarity, recognizability, category-specific examples, unsuitable-image guidance, visibility context, and the non-enforcement notice.
- Add concise, useful explanatory content for every requested rule while keeping recommendations distinct from mandatory technical restrictions.
- Store category and rule definitions in a typed configuration array so future categories or rules require only adding configuration and translation entries.
- Add complete English and Romanian strings through the existing localization dictionaries; other supported languages continue through the app’s existing localization mechanism.
- Preserve Settings & Activity → Support → Rules as the authenticated navigation path and keep existing public discovery links.

## Verification
- Check desktop and mobile layouts for readable widths, touch targets, and no horizontal overflow.
- Open and close rules across multiple categories and confirm only individual items expand with smooth accordion behavior.
- Verify English and Romanian titles and content.
- Verify Settings & Activity → Support → Rules still opens the page.
- Confirm the Help Center is unchanged and the app builds without errors.
