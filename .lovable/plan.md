# Admin Dashboard System

Add a single-admin role and a hidden `/admin/dashboard` reachable only via normal login, with backend-enforced authorization.

## 1. Database changes (migration)

- Extend the `user_type` enum with a new value: `'admin'` (keeping existing `artist`, `user`).
- Create a SECURITY DEFINER function `public.is_admin(_user_id uuid) RETURNS boolean` that checks `user_roles.user_type = 'admin'`. Used in RLS to avoid recursion.
- Add admin RLS policies:
  - `profiles`: admins can SELECT/UPDATE/DELETE all rows.
  - `user_roles`: admins can SELECT/UPDATE/DELETE all rows.
  - `subscription_events`: admins can SELECT all rows.
- Promote the designated admin account by inserting/updating a `user_roles` row to `user_type = 'admin'`. We will ask the user which email should be the admin before running the migration.

Note: deleting an `auth.users` row cascades to most tables via `auth.users` deletion, but not all our tables have FKs. The admin "Delete user" action will call an Edge Function (see §3) that uses the service role to delete the auth user and clean up `profiles` / `user_roles`.

## 2. Edge function: `admin-delete-user`

- Verifies caller JWT, looks up caller in `user_roles`, requires `user_type = 'admin'`.
- Uses `SUPABASE_SERVICE_ROLE_KEY` to call `auth.admin.deleteUser(targetId)` and delete related rows in `profiles`, `user_roles`, `posts`, `announcements`, etc.
- Backend-enforced; the only path for hard user deletion.

## 3. Frontend — role plumbing

- `src/hooks/useUserRole.ts` (new): centralizes session + `user_roles.user_type` fetch, exposes `{ role, loading }`.
- `src/components/Navigation.tsx`: when `role === 'admin'`, render an extra "Admin Dashboard" item in sidebar/menu (desktop + mobile). Hidden for everyone else.
- `Login.tsx` redirect: if `role === 'admin'`, navigate to `/admin/dashboard`; otherwise keep current artist/user routing.

## 4. Admin route + page

- `src/components/AdminRoute.tsx`: wrapper that checks role via `useUserRole`. While loading → null; if not admin → render a 403 Forbidden page (no redirect leak); if admin → children.
- `src/pages/AdminDashboard.tsx` at `/admin/dashboard` (registered in `App.tsx` inside `<AdminRoute>`):
  - **Users tab**: table of all profiles (avatar, stage_name, email, country, plan, role, created_at). Search by name/email. Actions: Edit (inline dialog for first_name, last_name, stage_name, email, phone, country, plan), Delete (calls `admin-delete-user`).
  - **Subscriptions tab**: list profiles with `stripe_subscription_id`, showing `plan`, `billing`, `subscription_status`, `subscription_current_period_end`. Read-only for now; link to Stripe customer portal optional later.
  - Simple shadcn `Table` + `Tabs` + confirmation `AlertDialog` for deletes. Uses `rounded-lg` per project standards.

## 5. Security guarantees

- All authorization is enforced by RLS + the edge function's role check. The hidden menu item and `AdminRoute` are UX only.
- Non-admin users hitting `/admin/dashboard` directly see 403 and cannot read/mutate admin data even via the API (RLS blocks them).
- Only one admin: enforced operationally (we set exactly one `user_roles` row to `admin`); no UI exposes promoting other users.

## 6. Memory updates

Add a memory entry documenting: admin role uses `user_type='admin'` in `user_roles`, single admin account, hidden `/admin/dashboard` route, RLS via `is_admin()` SECURITY DEFINER function.

## Question before implementing

Which existing account should be the admin? Provide the email of the user to promote (must already exist in the system). If you'd rather create a new admin account from scratch, tell me the email and I'll have you sign up first, then promote it.
