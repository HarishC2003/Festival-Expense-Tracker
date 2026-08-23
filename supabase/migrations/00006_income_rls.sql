-- Enable RLS
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_sequences ENABLE ROW LEVEL SECURITY;

-- General SELECT policies (everyone can view)
CREATE POLICY "Donors are viewable by everyone" ON public.donors FOR SELECT USING (true);
CREATE POLICY "Cash donations are viewable by everyone" ON public.cash_donations FOR SELECT USING (true);
CREATE POLICY "Item donations are viewable by everyone" ON public.item_donations FOR SELECT USING (true);
CREATE POLICY "Receipt sequences are viewable by everyone" ON public.receipt_sequences FOR SELECT USING (true);

-- Donors WRITE policies (Cross-year, so any user can write, backend enforces roles)
CREATE POLICY "Write to donors" ON public.donors FOR ALL USING (true);

-- Cash Donations WRITE policies (must be unlocked year)
CREATE POLICY "Write to cash_donations if year unlocked" ON public.cash_donations FOR ALL USING (
    is_year_unlocked(festival_year_id) OR public.is_super_admin()
);

-- Item Donations WRITE policies (must be unlocked year)
CREATE POLICY "Write to item_donations if year unlocked" ON public.item_donations FOR ALL USING (
    is_year_unlocked(festival_year_id) OR public.is_super_admin()
);

-- Receipt sequences WRITE policies
CREATE POLICY "Write to receipt_sequences" ON public.receipt_sequences FOR ALL USING (true);
