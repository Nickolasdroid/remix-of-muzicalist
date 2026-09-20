# Fix Announcements page states

## Changes
- Track announcement request failures separately from loading and successful empty results.
- Render the existing shared loading, empty, and error-state patterns in a strict order: loading, error, empty, results.
- Keep the current cards, ranking, filtering, pagination, permissions, creation, and promotion behavior unchanged.
- Add localized English and Romanian text for the loading, empty, error, and retry labels.
- Preserve the guest preview gate only when the successful response contains announcements.

## Verification
- Check the page after a successful empty response, a request failure with retry, and a normal response.
- Confirm English/Romanian rendering and current mobile content width.
- Confirm the preview build remains successful.
