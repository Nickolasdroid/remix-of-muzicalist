/**
 * Subscription-based styling utilities for consistent avatar/profile styling across the app.
 * 
 * Premium tier: Gold gradient outline
 * Free tier: Muted background outline (matches inactive navigation tabs)
 */

/**
 * Returns the CSS classes for an avatar wrapper div based on subscription plan.
 * Use this for the outer div that wraps an Avatar component.
 * 
 * @param plan - The subscription plan ('Premium', 'Free', or undefined)
 * @returns CSS classes for the wrapper div
 * 
 * @example
 * <div className={`p-0.5 rounded-full ${getAvatarOutlineClasses(profile.plan)}`}>
 *   <Avatar className="w-10 h-10 border-2 border-background">...</Avatar>
 * </div>
 */
export const getAvatarOutlineClasses = (plan?: string | null): string => {
  if (plan === 'Premium') {
    return 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600';
  }
  if (plan === 'Standard') {
    return 'bg-gradient-to-r from-red-800 via-red-900 to-red-800';
  }
  return 'bg-muted';
};

/**
 * Returns the CSS classes for larger avatar wrappers (profile pages).
 * Uses a slightly different gradient direction for visual interest.
 * 
 * @param plan - The subscription plan ('Premium', 'Free', or undefined)
 * @returns CSS classes for the wrapper div
 */
export const getAvatarOutlineClassesLarge = (plan?: string | null): string => {
  if (plan === 'Premium') {
    return 'bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600';
  }
  if (plan === 'Standard') {
    return 'bg-gradient-to-br from-red-800 via-red-900 to-red-800';
  }
  return 'bg-muted';
};

/**
 * Returns ring-based CSS classes for avatar styling (used in Messages).
 * 
 * @param plan - The subscription plan ('Premium', 'Free', or undefined)
 * @returns CSS classes for ring styling on Avatar component directly
 */
export const getAvatarRingClasses = (plan?: string | null): string => {
  if (plan === 'Premium') {
    return 'ring-2 ring-accent ring-offset-2 ring-offset-background';
  }
  if (plan === 'Standard') {
    return 'ring-2 ring-red-800 ring-offset-2 ring-offset-background';
  }
  return 'ring-2 ring-muted ring-offset-2 ring-offset-background';
};
