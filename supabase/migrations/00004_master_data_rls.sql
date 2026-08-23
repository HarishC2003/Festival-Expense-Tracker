-- Enable RLS on all new tables
ALTER TABLE public.committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- General SELECT policies (everyone can view master data)
CREATE POLICY "Master data is viewable by everyone" ON public.committee_members FOR SELECT USING (true);
CREATE POLICY "Master data is viewable by everyone" ON public.vendor_categories FOR SELECT USING (true);
CREATE POLICY "Master data is viewable by everyone" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Master data is viewable by everyone" ON public.income_categories FOR SELECT USING (true);
CREATE POLICY "Master data is viewable by everyone" ON public.expense_categories FOR SELECT USING (true);
CREATE POLICY "Master data is viewable by everyone" ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "Master data is viewable by everyone" ON public.units FOR SELECT USING (true);

-- General WRITE policies (locked = false checks)
-- Users with roles 'super_admin', 'treasurer', or 'committee_member' can typically write to these,
-- but the backend routes will enforce role-based access. Here we just enforce the locked year constraint at the DB level.
CREATE OR REPLACE FUNCTION is_year_unlocked(year_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM public.festival_years WHERE id = year_id AND locked = false);
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. committee_members
CREATE POLICY "Write to committee_members if year unlocked" ON public.committee_members FOR ALL USING (
    is_year_unlocked(festival_year_id) OR public.is_super_admin()
);

-- 2. vendor_categories
CREATE POLICY "Write to vendor_categories if year unlocked" ON public.vendor_categories FOR ALL USING (
    is_year_unlocked(festival_year_id) OR public.is_super_admin()
);

-- 3. vendors
CREATE POLICY "Write to vendors if year unlocked" ON public.vendors FOR ALL USING (
    is_year_unlocked(festival_year_id) OR public.is_super_admin()
);

-- 4. income_categories
CREATE POLICY "Write to income_categories if year unlocked" ON public.income_categories FOR ALL USING (
    is_year_unlocked(festival_year_id) OR public.is_super_admin()
);

-- 5. expense_categories
CREATE POLICY "Write to expense_categories if year unlocked" ON public.expense_categories FOR ALL USING (
    is_year_unlocked(festival_year_id) OR public.is_super_admin()
);

-- 6. payment_methods
CREATE POLICY "Write to payment_methods if year unlocked" ON public.payment_methods FOR ALL USING (
    is_year_unlocked(festival_year_id) OR public.is_super_admin()
);

-- 7. units
CREATE POLICY "Write to units if year unlocked" ON public.units FOR ALL USING (
    is_year_unlocked(festival_year_id) OR public.is_super_admin()
);

-- Storage bucket RLS policies for committee-photos
-- Everyone can read
CREATE POLICY "Anyone can view committee photos" ON storage.objects FOR SELECT USING ( bucket_id = 'committee-photos' );
-- Authenticated users can insert/update/delete
CREATE POLICY "Authenticated users can manage committee photos" ON storage.objects FOR ALL USING (
    bucket_id = 'committee-photos' AND auth.role() = 'authenticated'
);
