/**
 * Avatar styling utilities.
 *
 * Subscription-based avatar borders/rings were removed: every plan uses the
 * same (former Free) presentation. Helpers keep their signatures so callers
 * need no changes. Subscription logic itself is unaffected.
 */

export const getAvatarOutlineClasses = (_plan?: string | null): string => '!p-0 !bg-transparent';

export const getAvatarOutlineClassesLarge = (plan?: string | null): string => getAvatarOutlineClasses(plan);

export const getAvatarRingClasses = (_plan?: string | null): string => '';
