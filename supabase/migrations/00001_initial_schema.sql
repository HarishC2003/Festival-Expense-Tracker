-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('super_admin', 'treasurer', 'committee_member', 'volunteer', 'viewer', 'pending');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'approve', 'reject', 'login', 'logout');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'pending'::user_role,
    status user_status NOT NULL DEFAULT 'pending'::user_status,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Note: We can't immediately reference `public.users(id)` in `created_by` above without `public.users` existing, 
-- but since we're defining it in the same table, it's fine.

-- Festival Types
CREATE TABLE public.festival_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Festivals
CREATE TABLE public.festivals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Festival Years
CREATE TABLE public.festival_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_id UUID REFERENCES public.festivals(id) NOT NULL,
    year INT NOT NULL,
    start_date DATE,
    end_date DATE,
    location TEXT,
    status TEXT,
    description TEXT,
    locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMPTZ,
    locked_by UUID REFERENCES public.users(id),
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Settings
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_year_id UUID REFERENCES public.festival_years(id), -- Nullable for global settings
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(festival_year_id, key)
);

-- Audit Log
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    action audit_action NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_festival_types_updated_at BEFORE UPDATE ON public.festival_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_festivals_updated_at BEFORE UPDATE ON public.festivals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_festival_years_updated_at BEFORE UPDATE ON public.festival_years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
