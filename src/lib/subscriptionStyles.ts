/**
 * Avatar styling utilities.
 *
 * Rule: profile pictures never have an outline or ring, on any plan and
 * anywhere in the app (the plan shows as a badge, not around the avatar).
 * The only rings around avatars are functional: unseen stories and the
 * leaderboard podium (1st/2nd/3rd). Helpers keep their signatures so callers
 * need no changes.
 */

export const getAvatarOutlineClasses = (_plan?: string | null): string => '!p-0 !bg-transparent';

export const getAvatarOutlineClassesLarge = (plan?: string | null): string => getAvatarOutlineClasses(plan);

export const getAvatarRingClasses = (_plan?: string | null): string => '';
