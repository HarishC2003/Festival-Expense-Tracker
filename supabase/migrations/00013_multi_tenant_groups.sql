-- 00013_multi_tenant_groups.sql

-- 1. Create Enums
CREATE TYPE group_role AS ENUM ('owner', 'editor', 'viewer');
CREATE TYPE group_member_status AS ENUM ('pending', 'approved', 'rejected', 'removed');

-- 2. Create groups table
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code VARCHAR(6) UNIQUE NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES public.users(id) NOT NULL,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 3. Create group_members table
CREATE TABLE public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) NOT NULL,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    role group_role NOT NULL DEFAULT 'viewer'::group_role,
    status group_member_status NOT NULL DEFAULT 'pending'::group_member_status,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    decided_at TIMESTAMPTZ,
    decided_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Triggers for updated_at
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_group_members_updated_at BEFORE UPDATE ON public.group_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Data Backfill
DO $$ 
DECLARE 
    default_group_id UUID := gen_random_uuid();
    first_owner_id UUID;
BEGIN
    -- Find a super_admin to be the owner, or fallback to any active user
    SELECT id INTO first_owner_id FROM public.users WHERE role = 'super_admin' AND status = 'active' LIMIT 1;
    IF first_owner_id IS NULL THEN
        SELECT id INTO first_owner_id FROM public.users WHERE status = 'active' LIMIT 1;
    END IF;

    -- If there are no users at all, we can't create a default group with an owner.
    -- But assuming there is at least one.
    IF first_owner_id IS NOT NULL THEN
        INSERT INTO public.groups (id, name, code, description, owner_id)
        VALUES (default_group_id, 'Default Festival Group', 'DEF123', 'Auto-generated default group for existing data', first_owner_id);

        -- Insert all existing users into group_members
        INSERT INTO public.group_members (group_id, user_id, role, status, decided_at, decided_by)
        SELECT 
            default_group_id, 
            id, 
            CASE 
                WHEN role IN ('super_admin', 'treasurer') THEN 'owner'::group_role
                WHEN role IN ('committee_member', 'volunteer') THEN 'editor'::group_role
                ELSE 'viewer'::group_role 
            END,
            'approved'::group_member_status,
            NOW(),
            first_owner_id
        FROM public.users;

        -- 5. Add group_id to all existing tables and set default
        
        -- festivals
        ALTER TABLE public.festivals ADD COLUMN group_id UUID REFERENCES public.groups(id);
        UPDATE public.festivals SET group_id = default_group_id;
        ALTER TABLE public.festivals ALTER COLUMN group_id SET NOT NULL;

        -- festival_years
        ALTER TABLE public.festival_years ADD COLUMN group_id UUID REFERENCES public.groups(id);
        UPDATE public.festival_years SET group_id = default_group_id;
        ALTER TABLE public.festival_years ALTER COLUMN group_id SET NOT NULL;

        -- committee_members
        ALTER TABLE public.committee_members ADD COLUMN group_id UUID REFERENCES public.groups(id);
        UPDATE public.committee_members SET group_id = default_group_id;
        ALTER TABLE public.committee_members ALTER COLUMN group_id SET NOT NULL;

        -- vendors
        ALTER TABLE public.vendors ADD COLUMN group_id UUID REFERENCES public.groups(id);
        UPDATE public.vendors SET group_id = default_group_id;
        ALTER TABLE public.vendors ALTER COLUMN group_id SET NOT NULL;

        -- vendor_categories
        ALTER TABLE public.vendor_categories ADD COLUMN group_id UUID REFERENCES public.groups(id);
        UPDATE public.vendor_categories SET group_id = default_group_id;
        ALTER TABLE public.vendor_categories ALTER COLUMN group_id SET NOT NULL;

        -- income_categories
        ALTER TABLE public.income_categories ADD COLUMN group_id UUID REFERENCES public.groups(id);
        UPDATE public.income_categories SET group_id = default_group_id;
        ALTER TABLE public.income_categories ALTER COLUMN group_id SET NOT NULL;

        -- expense_categories
        ALTER TABLE public.expense_categories ADD COLUMN group_id UUID REFERENCES public.groups(id);
        UPDATE public.expense_categories SET group_id = default_group_id;
        ALTER TABLE public.expense_categories ALTER COLUMN group_id SET NOT NULL;

        -- payment_methods
        ALTER TABLE public.payment_methods ADD COLUMN group_id UUID REFERENCES public.groups(id);
        UPDATE public.payment_methods SET group_id = default_group_id;
        ALTER TABLE public.payment_methods ALTER COLUMN group_id SET NOT NULL;

        -- units
        ALTER TABLE public.units ADD COLUMN group_id UUID REFERENCES public.groups(id);
        UPDATE public.units SET group_id = default_group_id;
        ALTER TABLE public.units ALTER COLUMN group_id SET NOT NULL;

        -- donors
        ALTER TABLE public.donors ADD COLUMN group_id UUID REFERENCES public.groups(id);
        UPDATE public.donors SET group_id = default_group_id;
        ALTER TABLE public.donors ALTER COLUMN group_id SET NOT NULL;

        -- cash_donations
        ALTER TABLE public.cash_donations ADD COLUMN group_id UUID REFERENCES public.groups(id);
        UPDATE public.cash_donations SET group_id = default_group_id;
        ALTER TABLE public.cash_donations ALTER COLUMN group_id SET NOT NULL;

        -- item_donations
        ALTER TABLE public.item_donations ADD COLUMN group_id UUID REFERENCES public.groups(id);
        UPDATE public.item_donations SET group_id = default_group_id;
        ALTER TABLE public.item_donations ALTER COLUMN group_id SET NOT NULL;

        -- expenses
        ALTER TABLE public.expenses ADD COLUMN group_id UUID REFERENCES public.groups(id);
        UPDATE public.expenses SET group_id = default_group_id;
        ALTER TABLE public.expenses ALTER COLUMN group_id SET NOT NULL;

        -- albums
        ALTER TABLE public.albums ADD COLUMN group_id UUID REFERENCES public.groups(id);
        UPDATE public.albums SET group_id = default_group_id;
        ALTER TABLE public.albums ALTER COLUMN group_id SET NOT NULL;

        -- gallery_items
        ALTER TABLE public.gallery_items ADD COLUMN group_id UUID REFERENCES public.groups(id);
        UPDATE public.gallery_items SET group_id = default_group_id;
        ALTER TABLE public.gallery_items ALTER COLUMN group_id SET NOT NULL;

        -- documents
        ALTER TABLE public.documents ADD COLUMN group_id UUID REFERENCES public.groups(id);
        UPDATE public.documents SET group_id = default_group_id;
        ALTER TABLE public.documents ALTER COLUMN group_id SET NOT NULL;

        -- settings
        ALTER TABLE public.settings ADD COLUMN group_id UUID REFERENCES public.groups(id);
        UPDATE public.settings SET group_id = default_group_id;
        ALTER TABLE public.settings ALTER COLUMN group_id SET NOT NULL;
    END IF;
END $$;

-- 6. Add RLS Policies for Groups and Group Members
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Group RLS: You can view a group if you have an approved membership
CREATE POLICY "View groups if approved member" 
    ON public.groups FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm 
            WHERE gm.group_id = groups.id 
            AND gm.user_id = auth.uid() 
            AND gm.status = 'approved'
        )
    );

-- Group RLS: You can update a group if you are the owner
CREATE POLICY "Update groups if owner" 
    ON public.groups FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm 
            WHERE gm.group_id = groups.id 
            AND gm.user_id = auth.uid() 
            AND gm.role = 'owner'
            AND gm.status = 'approved'
        )
    );

-- Group Members RLS: View members of your groups
CREATE POLICY "View group members if approved member" 
    ON public.group_members FOR SELECT 
    USING (
        -- Can see your own row even if pending
        user_id = auth.uid() 
        OR 
        EXISTS (
            SELECT 1 FROM public.group_members gm 
            WHERE gm.group_id = group_members.group_id 
            AND gm.user_id = auth.uid() 
            AND gm.status = 'approved'
        )
    );

-- We won't strictly rely entirely on these RLS rules since our Node API 
-- will perform equivalent checks, but keeping them here ensures DB-level safety.

-- Note: RLS for all the other tables (festivals, expenses, etc.) currently relies on 
-- users.role. Since our Node backend bypasses RLS using supabaseAdmin, 
-- we will enforce group-scoping strictly in the Node Service layer.
-- We will update the old RLS policies to check group_members if accessed directly.

-- Function to check if user has access to a group
CREATE OR REPLACE FUNCTION has_group_access(check_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = check_group_id 
    AND user_id = auth.uid() 
    AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has write access to a group (owner/editor)
CREATE OR REPLACE FUNCTION has_group_write_access(check_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = check_group_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'editor')
    AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
