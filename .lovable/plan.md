

## Plan: Premium Split-Screen Artist Registration Entry (Step 0)

### Overview
Add a new "Step 0" email entry screen before the existing 4-step artist registration form. This screen uses a split-screen layout with branding on the left and an email form on the right.

### How It Works

**New Flow:**
1. **Step 0 (new)** — Split-screen with branding illustration + email input, Google sign-in option
2. **Steps 1-4 (existing)** — Current multi-step form (Basic, Professional, Media, Security), with email pre-filled from Step 0

### Changes — Single File: `src/pages/RegisterArtist.tsx`

**1. Add a new state `currentStep` starting at `0` instead of `1`**
- Step 0 = new email entry screen
- Steps 1-4 = existing form (renumber internal references by +0, just start from 0)

**2. Step 0 UI — Split-Screen Layout**

Desktop (side-by-side 50/50):
- **Left panel**: Dark red gradient background (`bg-gradient-to-br from-red-900 via-red-950 to-black`) with:
  - Subtle CSS stage lighting effects (radial gradients, light beams via pseudo-elements)
  - Musician silhouette imagery using the existing `registerArtistBg` asset as overlay
  - Heading: "Join Muzicalist"
  - Subtitle: "Create your artist profile and get booked for events"
  - Description: "Connect with clients, showcase your talent, and grow your music career."
  - Bold, premium typography

- **Right panel**: Dark background form with:
  - Logo at top
  - Title: "Create Artist Account"
  - Subtitle: "Start with your email address"
  - Email input field
  - Gold gradient "Continue" button
  - Divider: "Or continue with"
  - Google sign-in button (rounded, modern)
  - Terms text with clickable links to /terms and /privacy

Mobile: Left panel stacks on top (shorter height), form below.

**3. "Continue" button logic:**
- Validate email format
- Check email availability (reuse existing `checkEmailExists`)
- If valid, set `formData.email` and advance to Step 1
- Email field in Step 1 will be pre-filled and optionally read-only

**4. Adjust step navigation:**
- `previousStep` from Step 1 goes back to Step 0
- Step indicators (Basic/Professional/Media/Security) remain unchanged, only shown for steps 1-4
- `totalSteps` remains 4 for progress calculation on the form steps

**5. Google sign-in:**
- Use `supabase.auth.signInWithOAuth({ provider: 'google' })` 
- After Google auth, redirect to Step 1 with email pre-filled from the OAuth session

### Design Details
- Gold accent colors for CTA button (`bg-gradient-to-r from-amber-500 to-amber-600`)
- Soft glow on hover for button
- Rounded corners throughout
- Subtle particle/glow effects via CSS on left panel
- Premium dark theme consistent with existing app

### What Stays the Same
- All existing form fields, validation, database logic
- Plan selection (Step 5)
- Image cropping, phone validation
- Terms checkbox on Step 4
- All existing state management

