-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festival_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festival_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the current user is a super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role public.user_role;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN user_role = 'super_admin'::public.user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Users policies
-- Everyone can read users
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
-- Only super_admins can insert/update/delete users
CREATE POLICY "Users can be managed by super_admins" ON public.users FOR ALL USING (public.is_super_admin());

-- 2. Festival Types policies
CREATE POLICY "Festival types are viewable by everyone" ON public.festival_types FOR SELECT USING (true);
CREATE POLICY "Festival types can be managed by super_admins" ON public.festival_types FOR ALL USING (public.is_super_admin());

-- 3. Festivals policies
CREATE POLICY "Festivals are viewable by everyone" ON public.festivals FOR SELECT USING (true);
CREATE POLICY "Festivals can be managed by super_admins" ON public.festivals FOR ALL USING (public.is_super_admin());

-- 4. Festival Years policies
CREATE POLICY "Festival years are viewable by everyone" ON public.festival_years FOR SELECT USING (true);
-- Only super_admins and maybe treasurers can insert new years
-- For now, letting super_admins handle it, or we rely on backend service role for creation
CREATE POLICY "Festival years can be inserted by super_admins" ON public.festival_years FOR INSERT WITH CHECK (public.is_super_admin());
-- IMPORTANT: Users can only UPDATE festival_years if they are unlocked, EXCEPT super_admin who can lock/unlock
CREATE POLICY "Festival years can be updated if unlocked or by super_admin" ON public.festival_years FOR UPDATE USING (
    locked = false OR public.is_super_admin()
);
CREATE POLICY "Festival years can be deleted by super_admins" ON public.festival_years FOR DELETE USING (public.is_super_admin());

-- 5. Settings policies
CREATE POLICY "Settings are viewable by everyone" ON public.settings FOR SELECT USING (true);
-- Settings can only be updated if the associated festival year is unlocked
CREATE POLICY "Settings can be managed if year is unlocked" ON public.settings FOR ALL USING (
    (festival_year_id IS NULL AND public.is_super_admin()) OR 
    (
        festival_year_id IS NOT NULL AND 
        EXISTS (SELECT 1 FROM public.festival_years WHERE id = festival_year_id AND locked = false)
    )
);

-- 6. Audit Log policies
-- Audit log is viewable by super_admins
CREATE POLICY "Audit logs are viewable by super_admins" ON public.audit_log FOR SELECT USING (public.is_super_admin());
-- IMPORTANT: audit_log is insert-only from the backend service role, never directly writable by clients.
-- Since the service role bypasses RLS, we just ensure no inserts are allowed via the authenticated role.
CREATE POLICY "Clients cannot insert into audit_log" ON public.audit_log FOR INSERT WITH CHECK (false);
CREATE POLICY "Clients cannot update audit_log" ON public.audit_log FOR UPDATE USING (false);
CREATE POLICY "Clients cannot delete audit_log" ON public.audit_log FOR DELETE USING (false);
