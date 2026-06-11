UPDATE public.profiles
SET stripe_customer_id = NULL,
    stripe_subscription_id = NULL,
    subscription_status = NULL,
    subscription_current_period_end = NULL,
    subscription_cancel_at_period_end = false
WHERE stripe_customer_id IS NOT NULL
   OR stripe_subscription_id IS NOT NULL;