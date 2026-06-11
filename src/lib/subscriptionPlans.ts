/**
 * Single source of truth for subscription plans.
 * Used by:
 *  - /plans-pricing (PlansPricing.tsx)
 *  - /my-plan (MyPlan.tsx)
 *  - Artist registration plan selection step (RegisterArtist.tsx)
 *
 * Update this file to change pricing/features/descriptions everywhere.
 */

export type PlanFeature = {
  text: string;
  included: boolean;
};

export type SubscriptionPlan = {
  id: 'Free' | 'Standard' | 'Premium';
  name: string;
  monthlyPrice: number;
  emoji: string;
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
    emoji: '🟢',
    description: 'Start your presence on Muzicalist',
    features: [
      { text: 'Basic artist profile', included: true },
      { text: 'Gallery: up to 5 images (no video support)', included: true },
      { text: 'Select your music genres', included: true },
      { text: 'Set your experience level', included: true },
      { text: 'Messaging, direct contact & artist connections', included: true },
      { text: 'Calendar: booking requests (by day)', included: true },
      { text: '1 visible social media link', included: true },
      { text: 'Up to 3 visible reviews', included: true },
      { text: 'Appear in Leaderboard rankings', included: true },
      { text: 'Browse Posts & Announcements (opportunities)', included: true },
      { text: 'Cannot publish posts', included: false },
      { text: 'Cannot publish announcements', included: false },
      { text: 'Display your estimated pricing publicly', included: false },
      { text: 'Eligible for social media promotion opportunities', included: false },
      { text: 'Limited visibility in search results', included: false },
      { text: 'Performance analytics (profile views, booking requests, engagement)', included: false },
      { text: 'Eligible for homepage featuring', included: false },
    ],
    tagline: '👉 Perfect for getting started and exploring the platform',
    cta: 'Current Plan',
    registerCta: 'Continue with Free',
    highlighted: false,
  },
  {
    id: 'Standard',
    name: 'Standard',
    monthlyPrice: 12,
    emoji: '🟡',
    description: 'Get discovered. Attract more clients. Grow your bookings.',
    features: [
      { text: 'Standard Artist Badge', included: true },
      { text: 'Gallery: up to 10 images & 2 videos', included: true },
      { text: 'Select your music genres', included: true },
      { text: 'Set your experience level', included: true },
      { text: 'Unlimited messaging, direct contact & artist connections', included: true },
      { text: 'Publish up to 15 posts/month', included: true },
      { text: '5 Announcements + 2 Promotions/month', included: true },
      { text: 'Calendar: booking requests (by day)', included: true },
      { text: 'Display your estimated pricing publicly', included: true },
      { text: 'Unlimited visible reviews', included: true },
      { text: 'Up to 3 visible social links', included: true },
      { text: 'Appear in Leaderboard rankings', included: true },
      { text: 'Appear in Posts & Announcements (opportunities)', included: true },
      { text: 'Priority placement in search results', included: true },
      { text: 'Eligible for social media promotion opportunities', included: true },
      { text: 'Performance analytics (profile views, booking requests, engagement)', included: false },
      { text: 'Eligible for homepage featuring', included: false },
    ],
    tagline: '👉 Designed to help you gain more exposure and consistent booking opportunities',
    cta: 'Upgrade',
    registerCta: 'Choose Standard',
    highlighted: true,
  },
  {
    id: 'Premium',
    name: 'Premium',
    monthlyPrice: 24,
    emoji: '🔶',
    description: 'Maximize your visibility. Build authority. Get booked consistently.',
    features: [
      { text: 'Premium Artist Badge', included: true },
      { text: 'Gallery: up to 15 images & 5 videos', included: true },
      { text: 'Select your music genres', included: true },
      { text: 'Set your experience level', included: true },
      { text: 'Publish up to 30 posts/month', included: true },
      { text: '10 Announcements + 5 Promotions/month', included: true },
      { text: 'Unlimited messaging, direct contact & artist connections', included: true },
      { text: 'Professional calendar: Unlimited booking requests by day & time intervals', included: true },
      { text: 'Display your estimated pricing publicly', included: true },
      { text: 'Unlimited visible reviews', included: true },
      { text: 'Unlimited visible social links', included: true },
      { text: 'Appear in Leaderboard rankings', included: true },
      { text: 'Priority visibility in Posts & Announcements (opportunities)', included: true },
      { text: 'Top placement in search results', included: true },
      { text: 'Priority social media promotion opportunities', included: true },
      { text: 'Performance analytics (profile views, booking requests, engagement)', included: true },
      { text: 'Eligible for homepage featuring', included: true },
    ],
    tagline: '👉 Built for artists who want more visibility and steady income from events',
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
