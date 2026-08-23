-- Fix: Set audit_log.user_id to NULL when the referenced user is deleted
-- This preserves audit history while allowing user deletion.

ALTER TABLE public.audit_log
  DROP CONSTRAINT IF EXISTS audit_log_user_id_fkey;

ALTER TABLE public.audit_log
  ADD CONSTRAINT audit_log_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL;
