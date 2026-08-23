-- Receipt Sequences Helper
CREATE TABLE public.receipt_sequences (
    festival_year_id UUID REFERENCES public.festival_years(id) NOT NULL,
    prefix TEXT NOT NULL,
    current_value INTEGER DEFAULT 0,
    PRIMARY KEY (festival_year_id, prefix)
);

-- Function to generate receipt number safely
CREATE OR REPLACE FUNCTION generate_receipt_number(p_prefix TEXT, p_year_id UUID, p_year_text TEXT)
RETURNS TEXT AS $$
DECLARE
    next_val INTEGER;
    padded_val TEXT;
BEGIN
    INSERT INTO public.receipt_sequences (festival_year_id, prefix, current_value)
    VALUES (p_year_id, p_prefix, 1)
    ON CONFLICT (festival_year_id, prefix)
    DO UPDATE SET current_value = public.receipt_sequences.current_value + 1
    RETURNING current_value INTO next_val;

    padded_val := LPAD(next_val::text, 4, '0');
    RETURN p_prefix || '-' || p_year_text || '-' || padded_val;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Donors (cross-year)
CREATE TABLE public.donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Cash Donations
CREATE TABLE public.cash_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_year_id UUID REFERENCES public.festival_years(id) NOT NULL,
    donor_id UUID REFERENCES public.donors(id) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    payment_method_id UUID REFERENCES public.payment_methods(id),
    income_category_id UUID REFERENCES public.income_categories(id),
    collected_by UUID REFERENCES public.committee_members(id),
    donation_date DATE NOT NULL,
    receipt_number TEXT UNIQUE NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Item Donations
CREATE TABLE public.item_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_year_id UUID REFERENCES public.festival_years(id) NOT NULL,
    donor_id UUID REFERENCES public.donors(id) NOT NULL,
    item_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit_id UUID REFERENCES public.units(id),
    estimated_value NUMERIC(12,2),
    income_category_id UUID REFERENCES public.income_categories(id),
    collected_by UUID REFERENCES public.committee_members(id),
    donation_date DATE NOT NULL,
    receipt_number TEXT UNIQUE NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Add updated_at triggers
CREATE TRIGGER update_donors_updated_at BEFORE UPDATE ON public.donors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cash_donations_updated_at BEFORE UPDATE ON public.cash_donations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_item_donations_updated_at BEFORE UPDATE ON public.item_donations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
