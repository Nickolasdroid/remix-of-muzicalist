/**
 * Subscription-based styling utilities for consistent avatar/profile styling across the app.
 *
 * Premium tier: fixed gold outline
 * Standard tier: fixed white outline
 * Free tier: no outline at all
 */

const normalizePlan = (plan?: string | null): string => (plan || '').trim().toLowerCase();

export const getAvatarOutlineClasses = (plan?: string | null): string => {
  const normalizedPlan = normalizePlan(plan);
  if (normalizedPlan === 'premium') return 'bg-amber-400';
  if (normalizedPlan === 'standard') return 'bg-white';
  return '!p-0 !bg-transparent';
};

export const getAvatarOutlineClassesLarge = (plan?: string | null): string => {
  return getAvatarOutlineClasses(plan);
};

export const getAvatarRingClasses = (plan?: string | null): string => {
  if (plan === 'Premium') return 'ring-2 ring-amber-400 ring-offset-2 ring-offset-background';
  if (plan === 'Standard') return 'ring-2 ring-white ring-offset-2 ring-offset-background';
  return '';
};
