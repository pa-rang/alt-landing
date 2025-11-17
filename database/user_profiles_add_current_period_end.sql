-- Add current_period_end column to user_profiles table
-- This field stores the end date of the current subscription period from Stripe

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS current_period_end timestamp with time zone NULL;

COMMENT ON COLUMN public.user_profiles.current_period_end IS 'End date of the current subscription period (from Stripe subscription.current_period_end)';

