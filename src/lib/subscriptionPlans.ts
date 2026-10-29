/**
 * Single source of truth for subscription plans.
 * Used by:
 *  - /plans-pricing (PlansPricing.tsx)
 *  - /my-plan (MyPlan.tsx)
 *  - Artist registration plan selection step (RegisterArtist.tsx)
 *
 * Update this file to change pricing/features/descriptions everywhere.
 */

/**
 * Plan cards list only what a plan includes (no crossed-out rows); every line
 * must match the real limits in planLimits.ts / public.plan_limits.
 */
export type PlanFeature = {
  text: string;
  included: boolean;
};

export type SubscriptionPlan = {
  id: 'Free' | 'Standard' | 'Premium';
  name: string;
  monthlyPrice: number;
  description: string;
  features: PlanFeature[];
  tagline: string;
  cta: string;
  registerCta: string;
  highlighted: boolean;
};

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'Free',
    name: 'Free',
    monthlyPrice: 0,
    description: 'Start your presence on Muzicalist',
    features: [
      { text: 'Basic artist profile', included: true },
      { text: 'Gallery: up to 5 images & 1 video', included: true },
      { text: 'Display your estimated pricing publicly', included: true },
      { text: 'Display your music genres', included: true },
      { text: 'Messaging, direct contact & artist connections', included: true },
      { text: 'Booking calendar: receive requests with exact date and time', included: true },
      { text: '1 visible social media link', included: true },
      { text: 'Eligible for Leaderboard rankings', included: true },
      { text: 'Browse Posts & Announcements (opportunities)', included: true },
    ],
    tagline: 'Perfect for getting started and exploring the platform',
    cta: 'Current Plan',
    registerCta: 'Continue with Free',
    highlighted: false,
  },
  {
    id: 'Standard',
    name: 'Standard',
    monthlyPrice: 12,
    description: 'Get discovered. Attract more clients. Grow your bookings.',
    features: [
      { text: 'Standard Artist Badge', included: true },
      { text: 'Gallery: up to 10 images & 3 videos', included: true },
      { text: 'Display your music genres', included: true },
      { text: 'Unlimited messaging, direct contact & artist connections', included: true },
      { text: 'Publish up to 15 posts/month', included: true },
      { text: 'Publish up to 5 announcements/month', included: true },
      { text: 'Promotions: 2 posts + 1 announcement/month', included: true },
      { text: 'Booking calendar: receive requests with exact date and time', included: true },
      { text: 'Display your estimated pricing publicly', included: true },
      { text: 'All 5 social links visible', included: true },
      { text: 'Eligible for Leaderboard rankings', included: true },
      { text: 'Appear in Posts & Announcements (opportunities)', included: true },
      { text: 'Priority placement in search results', included: true },
      { text: 'Eligible for social media promotion opportunities', included: true },
    ],
    tagline: 'Designed to help you gain more exposure and consistent booking opportunities',
    cta: 'Upgrade',
    registerCta: 'Choose Standard',
    highlighted: true,
  },
  {
    id: 'Premium',
    name: 'Premium',
    monthlyPrice: 24,
    description: 'Maximize your visibility. Build authority. Get booked consistently.',
    features: [
      { text: 'Premium Artist Badge', included: true },
      { text: 'Gallery: up to 15 images & 5 videos', included: true },
      { text: 'Display your music genres', included: true },
      { text: 'Publish up to 30 posts/month', included: true },
      { text: 'Publish up to 10 announcements/month', included: true },
      { text: 'Promotions: 5 posts + 3 announcements/month', included: true },
      { text: 'Unlimited messaging, direct contact & artist connections', included: true },
      { text: 'Booking calendar: receive requests with exact date and time', included: true },
      { text: 'Display your estimated pricing publicly', included: true },
      { text: 'All 5 social links visible', included: true },
      { text: 'Eligible for Leaderboard rankings', included: true },
      { text: 'Priority visibility in Posts & Announcements (opportunities)', included: true },
      { text: 'Top placement in search results', included: true },
      { text: 'Priority social media promotion opportunities', included: true },
      { text: 'Performance analytics (profile views, booking requests, engagement)', included: true },
      { text: 'Eligible for homepage featuring', included: true },
    ],
    tagline: 'Built for artists who want more visibility and steady income from events',
    cta: 'Upgrade',
    registerCta: 'Choose Premium',
    highlighted: false,
  },
];

/**
 * Format the displayed price string given the plan's monthly price and billing cycle.
 * Annual price is computed as monthly * 10 (≈17% discount).
 */
export const formatPlanPrice = (monthlyPrice: number, isAnnual: boolean): string => {
  if (monthlyPrice === 0) return '$0';
  if (isAnnual) return `$${Math.round(monthlyPrice * 10)}`;
  return `$${monthlyPrice}`;
};
