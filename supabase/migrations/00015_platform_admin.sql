-- 00015_platform_admin.sql
-- Add platform admin flag to users

ALTER TABLE public.users
ADD COLUMN is_platform_admin BOOLEAN DEFAULT false;

-- Add a comment for security audit
COMMENT ON COLUMN public.users.is_platform_admin IS 'True if the user is a platform-wide super administrator. Can only be set manually in DB.';
