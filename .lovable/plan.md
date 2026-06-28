## Goal
For user-type accounts (non-artists), the location fields in Settings → Edit Profile should never look pre-filled with a default they didn't choose. Show Country and Region as read-only, and display "Not set" when no real value exists.

## Context
- Users don't enter country/region during registration (`src/pages/RegisterUser.tsx`).
- The `handle_new_user` DB trigger currently writes `country = 'Romania'` and `county = ''` by default for every new account, including users.
- Artists DO pick country/region during their registration, so their values are real and must keep displaying as-is.

## Changes

### 1. Stop auto-filling location for user accounts (DB)
Update the `handle_new_user` trigger so the Romania default only applies when `account_type = 'artist'`. For users, insert `country = NULL` and `county = NULL` unless the signup metadata explicitly provides values. Existing artist behavior is unchanged.

### 2. Settings → Edit Profile display (`src/components/SettingsTab.tsx`)
In the `EditProfilePanel` Country and Region read-only inputs:
- Detect "no real value": for users, treat `NULL`/empty as missing.
- When missing, render the input with placeholder text "Not set" and an empty value (instead of showing "Romania" or a blank field).
- Keep both fields read-only for everyone (artists keep seeing their actual values; users without a location see "Not set").

### 3. Optional cleanup of existing user rows
Existing user-type profiles already have `country = 'Romania'` from the old trigger. Run a one-time data update to set `country = NULL` and `county = NULL` for rows in `profiles` whose `user_roles.user_type = 'user'` AND that still match the default (`country = 'Romania'` AND `county IS NULL OR county = ''`). Artists are untouched.

## Out of scope
- No new UI to let users edit their location (per earlier preference, these fields stay read-only in Settings).
- No changes to the user registration form.
- No changes to artist registration or artist profile editing.
