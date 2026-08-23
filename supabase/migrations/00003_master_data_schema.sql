-- Enum for income types
CREATE TYPE income_type AS ENUM ('cash', 'item');

-- Committee Members
CREATE TABLE public.committee_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_year_id UUID REFERENCES public.festival_years(id) NOT NULL,
    user_id UUID REFERENCES public.users(id), -- nullable
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    role_title TEXT,
    address TEXT,
    photo_url TEXT,
    emergency_contact TEXT,
    active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Vendor Categories
CREATE TABLE public.vendor_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_year_id UUID REFERENCES public.festival_years(id) NOT NULL,
    name TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Vendors
CREATE TABLE public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_year_id UUID REFERENCES public.festival_years(id) NOT NULL,
    vendor_category_id UUID REFERENCES public.vendor_categories(id),
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Income Categories
CREATE TABLE public.income_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_year_id UUID REFERENCES public.festival_years(id) NOT NULL,
    name TEXT NOT NULL,
    type income_type NOT NULL,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Expense Categories
CREATE TABLE public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_year_id UUID REFERENCES public.festival_years(id) NOT NULL,
    name TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Payment Methods
CREATE TABLE public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_year_id UUID REFERENCES public.festival_years(id) NOT NULL,
    name TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Units
CREATE TABLE public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_year_id UUID REFERENCES public.festival_years(id) NOT NULL,
    name TEXT NOT NULL,
    abbreviation TEXT,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Add updated_at triggers
CREATE TRIGGER update_committee_members_updated_at BEFORE UPDATE ON public.committee_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_categories_updated_at BEFORE UPDATE ON public.vendor_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_income_categories_updated_at BEFORE UPDATE ON public.income_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON public.expense_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create committee-photos storage bucket (requires inserting into storage.buckets if using pure SQL)
INSERT INTO storage.buckets (id, name, public) VALUES ('committee-photos', 'committee-photos', true) ON CONFLICT (id) DO NOTHING;
