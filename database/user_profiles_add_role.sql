-- Add role column to user_profiles table
-- This field stores the user role: 'admin' or 'user'

-- ENUM 타입 생성 (타입이 존재하지 않을 때만 생성)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user' NOT NULL;

COMMENT ON COLUMN public.user_profiles.role IS 'User role: admin or user (default: user)';

