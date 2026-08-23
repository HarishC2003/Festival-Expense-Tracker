-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_status_history ENABLE ROW LEVEL SECURITY;

-- General SELECT policies (everyone can view)
CREATE POLICY "Expenses viewable by everyone" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "History viewable by everyone" ON public.expense_status_history FOR SELECT USING (true);

-- Expenses WRITE policies (must be unlocked year)
CREATE POLICY "Write to expenses if year unlocked" ON public.expenses FOR ALL USING (
    is_year_unlocked(festival_year_id) OR public.is_super_admin()
);

-- History is append-only by authenticated users
CREATE POLICY "Insert expense history" ON public.expense_status_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Storage bucket RLS policies for receipts
-- Everyone can read
CREATE POLICY "Anyone can view receipts" ON storage.objects FOR SELECT USING ( bucket_id = 'receipts' );
-- Authenticated users can insert/update/delete
CREATE POLICY "Authenticated users can manage receipts" ON storage.objects FOR ALL USING (
    bucket_id = 'receipts' AND auth.role() = 'authenticated'
);
