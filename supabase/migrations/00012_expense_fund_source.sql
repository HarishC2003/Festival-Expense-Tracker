ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS fund_source VARCHAR(20) DEFAULT 'committee';
