CREATE TYPE expense_status AS ENUM ('pending', 'approved', 'rejected', 'reimbursed');

CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_year_id UUID REFERENCES public.festival_years(id) NOT NULL,
    expense_category_id UUID REFERENCES public.expense_categories(id),
    amount NUMERIC(12,2) NOT NULL,
    paid_by UUID REFERENCES public.committee_members(id) NOT NULL,
    vendor_id UUID REFERENCES public.vendors(id),
    bill_available BOOLEAN DEFAULT false,
    receipt_image_url TEXT,
    payment_method_id UUID REFERENCES public.payment_methods(id),
    expense_date DATE NOT NULL,
    description TEXT,
    status expense_status DEFAULT 'pending',
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMPTZ,
    rejected_reason TEXT,
    reimbursed_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE public.expense_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID REFERENCES public.expenses(id) NOT NULL,
    from_status expense_status,
    to_status expense_status NOT NULL,
    changed_by UUID REFERENCES public.users(id) NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create receipts storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true) ON CONFLICT (id) DO NOTHING;
