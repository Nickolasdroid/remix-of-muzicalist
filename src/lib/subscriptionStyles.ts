/**
 * Subscription-based styling utilities for consistent avatar/profile styling across the app.
 *
 * Premium tier: amber (matches the gold crown badge)
 * Standard tier: zinc-300 (matches the silver crown badge)
 * Free tier: muted background outline
 */

export const getAvatarOutlineClasses = (plan?: string | null): string => {
  if (plan === 'Premium') return 'bg-amber-400';
  if (plan === 'Standard') return 'bg-zinc-300';
  return 'bg-muted';
};

export const getAvatarOutlineClassesLarge = (plan?: string | null): string => {
  if (plan === 'Premium') return 'bg-amber-400';
  if (plan === 'Standard') return 'bg-zinc-300';
  return 'bg-muted';
};

export const getAvatarRingClasses = (plan?: string | null): string => {
  if (plan === 'Premium') return 'ring-2 ring-amber-400 ring-offset-2 ring-offset-background';
  if (plan === 'Standard') return 'ring-2 ring-zinc-300 ring-offset-2 ring-offset-background';
  return 'ring-2 ring-muted ring-offset-2 ring-offset-background';
};
