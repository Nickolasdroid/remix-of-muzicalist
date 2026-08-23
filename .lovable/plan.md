# Make Welcome Posts reachable from the Official Muzicalist dashboard

## Findings (verified on the live app)

The Welcome Posts UI is not broken or hidden. Signed in as admin and opened `/admin/dashboard`: the tab strip renders `Users · Artists · Subscriptions · Communications · Reports · Verifications · Welcome Posts`, and clicking **Welcome Posts** loads the full artist list with statuses, search, filters, checkboxes and the create action.

The reason it looked missing: it was only added to the admin management page `/admin/dashboard`, while the page being used is `/dashboard` — the Muzicalist Official profile dashboard, which currently shows only `Posts | Announcements` for admins.

## What to change

Add an admin-only third tab to the Official dashboard so the workflow is reachable where the admin actually works.

- On `/dashboard`, when the account is admin, the tab strip becomes: `Posts | Announcements | Welcome Posts`.
- The new tab renders the existing `AdminWelcomePostsTab` component — the same interface as in `/admin/dashboard`, with search, All / Not published / Published filters, avatars, name, category, county/country, status, checkbox selection, select-all-eligible, single and bulk create, preview/confirm, and View Post for published artists.
- Non-admin artists and users see no change at all.
- The tab remains available in `/admin/dashboard` as well; both entry points use the same component.

## Technical notes

- `src/pages/Dashboard.tsx`: add a `welcome-posts` `TabsTrigger` + `TabsContent` inside the existing `isAdmin` branch, switch the admin `TabsList` from `grid-cols-2` to `grid-cols-3`, and allow `welcome-posts` in the tab-normalisation effect (line ~110) that currently forces admins back to Posts/Announcements. Keep `?tab=welcome-posts` deep-linking working like the other tabs.
- The component needs the admin profile list it already consumes in `/admin/dashboard` (`profiles`, `roles`, `loading`, `adminProfile`). On `/dashboard` those aren't loaded, so fetch them lazily inside the tab (only when the admin opens it) rather than adding a page-wide query.
- No backend work: `create_artist_joined_post(_artist_id)` and `admin_list_artist_joined_posts()` stay exactly as they are, no new `artist_joined` mechanism, Lexya's post untouched, no automatic publishing on registration.

## Verification

Reload `/dashboard` as the Muzicalist admin, confirm the third tab appears, open it, confirm the artist list and statuses load (Lexya shown as Published, duplicate creation blocked), and confirm a regular artist's dashboard is unchanged.
