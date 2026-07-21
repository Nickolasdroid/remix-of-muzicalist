export interface AdminProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  stage_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  county: string | null;
  plan: string | null;
  avatar_url: string | null;
  created_at: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  subscription_current_period_end: string | null;
  billing: string | null;
  specialization: string | null;
  is_verified: boolean | null;
  verification_status: string | null;
  is_active: boolean | null;
  last_sign_in_at: string | null;
  avg_rating: number | null;
  reviews_count: number | null;
}
