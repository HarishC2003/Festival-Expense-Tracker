-- OTP verification tokens table
CREATE TABLE IF NOT EXISTS public.email_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_email_otps_user_id ON public.email_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON public.email_otps(email);

-- RLS
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write OTPs (backend handles this via admin client)
CREATE POLICY "Service role only" ON public.email_otps
    USING (false);
