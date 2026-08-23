-- 00014_strict_rls_policies.sql
-- Implements strict IDOR prevention by enforcing group_id checks

DO $$
DECLARE
    t_name text;
    tables_list text[] := ARRAY[
        'festivals', 'festival_years', 'committee_members', 'vendors', 
        'vendor_categories', 'income_categories', 'expense_categories', 
        'payment_methods', 'units', 'donors', 'cash_donations', 
        'item_donations', 'expenses', 'albums', 'gallery_items', 
        'documents', 'settings', 'audit_log'
    ];
BEGIN
    FOREACH t_name IN ARRAY tables_list
    LOOP
        -- Drop all existing policies safely (ignoring errors if they don't exist)
        EXECUTE format('DROP POLICY IF EXISTS "View %I" ON public.%I', t_name, t_name);
        EXECUTE format('DROP POLICY IF EXISTS "Insert %I" ON public.%I', t_name, t_name);
        EXECUTE format('DROP POLICY IF EXISTS "Update %I" ON public.%I', t_name, t_name);
        EXECUTE format('DROP POLICY IF EXISTS "Delete %I" ON public.%I', t_name, t_name);
        
        -- Fallback drops for old policy names (optional, catching common patterns)
        EXECUTE format('DROP POLICY IF EXISTS "Users can view %I" ON public.%I', t_name, t_name);
        EXECUTE format('DROP POLICY IF EXISTS "Users can insert %I" ON public.%I', t_name, t_name);
        EXECUTE format('DROP POLICY IF EXISTS "Users can update %I" ON public.%I', t_name, t_name);
        EXECUTE format('DROP POLICY IF EXISTS "Users can delete %I" ON public.%I', t_name, t_name);

        -- Ensure RLS is enabled
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);

        -- Create strict SELECT policy (All members can read)
        EXECUTE format('
            CREATE POLICY "Strict SELECT %I" ON public.%I FOR SELECT 
            USING (public.has_group_access(group_id));
        ', t_name, t_name);

        -- Create strict INSERT policy
        IF t_name IN ('expenses', 'documents', 'gallery_items') THEN
            -- Allow any approved member to submit expenses and upload media/docs
            EXECUTE format('
                CREATE POLICY "Strict INSERT %I" ON public.%I FOR INSERT 
                WITH CHECK (public.has_group_access(group_id));
            ', t_name, t_name);
        ELSE
            -- Strict write access for master data and donations
            EXECUTE format('
                CREATE POLICY "Strict INSERT %I" ON public.%I FOR INSERT 
                WITH CHECK (public.has_group_write_access(group_id));
            ', t_name, t_name);
        END IF;

        -- Create strict UPDATE policy
        IF t_name IN ('expenses') THEN
             -- Users can update their own expenses, or editors/owners can update any
             EXECUTE format('
                CREATE POLICY "Strict UPDATE %I" ON public.%I FOR UPDATE 
                USING (public.has_group_write_access(group_id) OR submitted_by = auth.uid())
                WITH CHECK (public.has_group_write_access(group_id) OR submitted_by = auth.uid());
            ', t_name, t_name);
        ELSE
            EXECUTE format('
                CREATE POLICY "Strict UPDATE %I" ON public.%I FOR UPDATE 
                USING (public.has_group_write_access(group_id))
                WITH CHECK (public.has_group_write_access(group_id));
            ', t_name, t_name);
        END IF;

        -- Create strict DELETE policy
        EXECUTE format('
            CREATE POLICY "Strict DELETE %I" ON public.%I FOR DELETE 
            USING (public.has_group_write_access(group_id));
        ', t_name, t_name);
    END LOOP;
END $$;
