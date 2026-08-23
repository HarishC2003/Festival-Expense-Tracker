-- Create storage buckets for documents, gallery, and receipts
insert into storage.buckets (id, name, public) 
values 
  ('documents', 'documents', true),
  ('gallery', 'gallery', true),
  ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- Set up RLS policies for documents bucket
create policy "Public Access documents"
  on storage.objects for select
  using ( bucket_id = 'documents' );

create policy "Authenticated Insert documents"
  on storage.objects for insert
  with check ( bucket_id = 'documents' and auth.role() = 'authenticated' );
  
create policy "Authenticated Delete documents"
  on storage.objects for delete
  using ( bucket_id = 'documents' and auth.role() = 'authenticated' );

-- Set up RLS policies for gallery bucket
create policy "Public Access gallery"
  on storage.objects for select
  using ( bucket_id = 'gallery' );

create policy "Authenticated Insert gallery"
  on storage.objects for insert
  with check ( bucket_id = 'gallery' and auth.role() = 'authenticated' );
  
create policy "Authenticated Delete gallery"
  on storage.objects for delete
  using ( bucket_id = 'gallery' and auth.role() = 'authenticated' );

-- Set up RLS policies for receipts bucket
create policy "Public Access receipts"
  on storage.objects for select
  using ( bucket_id = 'receipts' );

create policy "Authenticated Insert receipts"
  on storage.objects for insert
  with check ( bucket_id = 'receipts' and auth.role() = 'authenticated' );
  
create policy "Authenticated Delete receipts"
  on storage.objects for delete
  using ( bucket_id = 'receipts' and auth.role() = 'authenticated' );
