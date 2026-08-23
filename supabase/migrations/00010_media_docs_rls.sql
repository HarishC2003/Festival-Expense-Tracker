ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY "Albums viewable by everyone" ON public.albums FOR SELECT USING (true);
CREATE POLICY "Gallery items viewable by everyone" ON public.gallery_items FOR SELECT USING (true);
CREATE POLICY "Documents viewable by authenticated users" ON public.documents FOR SELECT USING (auth.role() = 'authenticated');

-- Write policies
CREATE POLICY "Manage albums if year unlocked" ON public.albums FOR ALL USING (
    is_year_unlocked(festival_year_id) OR public.is_super_admin()
);
CREATE POLICY "Manage gallery_items if year unlocked" ON public.gallery_items FOR ALL USING (
    is_year_unlocked(festival_year_id) OR public.is_super_admin()
);
CREATE POLICY "Manage documents if year unlocked" ON public.documents FOR ALL USING (
    is_year_unlocked(festival_year_id) OR public.is_super_admin()
);

-- Storage bucket RLS policies for gallery (public read)
CREATE POLICY "Anyone can view gallery" ON storage.objects FOR SELECT USING ( bucket_id = 'gallery' );
CREATE POLICY "Authenticated users can manage gallery" ON storage.objects FOR ALL USING (
    bucket_id = 'gallery' AND auth.role() = 'authenticated'
);

-- Storage bucket RLS policies for documents (authenticated read)
CREATE POLICY "Authenticated users can view documents" ON storage.objects FOR SELECT USING (
    bucket_id = 'documents' AND auth.role() = 'authenticated'
);
CREATE POLICY "Authenticated users can manage documents" ON storage.objects FOR ALL USING (
    bucket_id = 'documents' AND auth.role() = 'authenticated'
);
