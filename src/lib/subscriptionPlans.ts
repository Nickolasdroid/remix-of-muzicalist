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
      { text: "Display your music genres", included: true },
      { text: "Gallery: up to 5 photos & 1 video", included: true },
      { text: "Up to 3 posts/month, availability posts included", included: true },
      { text: "Booking calendar: requests with exact date and time", included: true },
      { text: "Unlimited messages and artist connections", included: true },
      { text: "Eligible for Leaderboard rankings", included: true },
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
      { text: "Display your music genres", included: true },
      { text: "Display your estimated prices", included: true },
      { text: "Gallery: up to 10 photos & 3 videos", included: true },
      { text: "Up to 15 posts/month: posts, availability and collaborations", included: true },
      { text: "Publish stories, visible for 24 hours", included: true },
      { text: "Booking calendar: requests with exact date and time", included: true },
      { text: "Unlimited messages and artist connections", included: true },
      { text: "Number of profile views", included: true },
      { text: "Your posts appear higher in the feed", included: true },
      { text: "Higher placement in search and artist lists", included: true },
      { text: "Eligible for Leaderboard rankings", included: true },
      { text: "Chances to be promoted on Muzicalist's social media", included: true },
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
      { text: "Display your music genres", included: true },
      { text: "Display your estimated prices", included: true },
      { text: "Gallery: up to 15 photos & 5 videos", included: true },
      { text: "Up to 30 posts/month: posts, availability and collaborations", included: true },
      { text: "Publish stories, visible for 24 hours", included: true },
      { text: "Booking calendar: requests with exact date and time", included: true },
      { text: "Unlimited messages and artist connections", included: true },
      { text: "Statistics: from profile views to requests and bookings", included: true },
      { text: "Your posts appear highest in the feed", included: true },
      { text: "Top placement in search and artist lists", included: true },
      { text: "Eligible for Leaderboard rankings", included: true },
      { text: "Priority promotion on Muzicalist's social media", included: true },
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
