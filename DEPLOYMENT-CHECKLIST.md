# Deployment Checklist for Vercel + Supabase

Before deploying the Festival Finance Manager to production, ensure the following steps are completed.

## 1. Database (Supabase)
- [ ] Run all pending migrations: `supabase db push` or execute SQL files in the Supabase Dashboard SQL Editor sequentially up to `00015_platform_admin.sql`.
- [ ] Verify Row Level Security (RLS) is enabled on all tables.
- [ ] Manually set `is_platform_admin = true` for the initial administrator account in the `users` table via the Supabase Dashboard.
- [ ] Configure Supabase Authentication settings:
  - Disable "Allow new users to sign up" if the platform is invite-only, or leave enabled if self-registration is permitted.
  - Set the JWT expiry time (recommended: 1 hour).
  - Configure Email Provider settings (SMTP) for sending OTPs.
  - Set the Site URL and Redirect URLs to the production Vercel domain.

## 2. Backend (Node.js/Express)
- [ ] Set Production Environment Variables:
  - `PORT`: Inherited from Vercel/host (typically not needed if deployed as serverless functions, but required if running as a standalone Express app).
  - `SUPABASE_URL`: Your Supabase project URL.
  - `SUPABASE_SERVICE_ROLE_KEY`: The Service Role Key (Keep this secret! Never expose to the frontend).
- [ ] Ensure `express-rate-limit` is functioning correctly behind Vercel's edge network by verifying the `X-Forwarded-For` header is trusted if applicable.
- [ ] Verify CORS settings allow requests only from the production frontend domain.

## 3. Frontend (React/Vite)
- [ ] Set Production Environment Variables (in Vercel):
  - `VITE_SUPABASE_URL`: Your Supabase project URL.
  - `VITE_SUPABASE_ANON_KEY`: The public anonymous key.
- [ ] Verify API endpoints point to the production backend URL (e.g., replace `http://localhost:3001` with the actual backend domain). *Note: Ensure the frontend `fetch` calls dynamically use the backend URL using an environment variable like `VITE_API_URL` instead of hardcoded localhost.*
- [ ] Run a production build locally (`npm run build`) to ensure there are no TypeScript or bundling errors.

## 4. Post-Deployment Verification
- [ ] Test the user registration and OTP flow.
- [ ] Test the login rate limiter by attempting 6 incorrect logins and verifying the 429 response.
- [ ] Test Group creation and joining.
- [ ] Verify IDOR protections: Attempt to fetch or modify a group/expense using a token from a user who is not a member of that group.
- [ ] Log in as the designated platform admin and verify access to the `/admin` dashboard.
- [ ] Monitor Vercel logs for any unhandled exceptions or structured log warnings (`unauthorized_access`, `forbidden_access`).
