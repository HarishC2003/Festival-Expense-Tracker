# Vercel Monorepo Deployment Walkthrough

I have successfully re-architected your API and project configuration so that **both your React Frontend and your Express Backend** will be deployed simultaneously on Vercel! 

This completely eliminates the need to host the backend separately on Render.

## What changed?
1. **API Serverless Entry**: I created a new `api/index.ts` file at the root. Vercel automatically detects this folder and converts your Express backend into high-performance Serverless Functions!
2. **Configuration**: I updated `vercel.json` and `package.json` to tell Vercel exactly how to route `/api` traffic to the backend, and all other traffic to the React app.

## Final Steps to complete in Vercel

> [!IMPORTANT]
> Because the codebase architecture changed to a "monorepo" style, you **MUST** update 3 settings in your Vercel Dashboard right now, otherwise the deployment will fail.

Please go to your Vercel Dashboard, open your project, and follow these exact steps:

### 1. Change Root Directory back to Root
- Go to **Settings** -> **General**.
- Look for **Root Directory**.
- Click **Edit**, clear the word "frontend" so it is just `./` (the root directory), and click **Save**.

### 2. Set the Output Directory
- Scroll down slightly to **Build and Output Settings**.
- Click the toggle switch to override the **Output Directory**.
- Type exactly: `frontend/dist`
- Click **Save**.

### 3. Add Backend Environment Variables
Since Vercel is now running your backend, it needs the backend environment variables! 
- Go to **Settings** -> **Environment Variables**.
- Add the following variables (copy values from your local `.env` file):
  - `DATABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_JWKS_URL`
  - `VITE_API_URL` -> Set this to your live Vercel domain (e.g., `https://festival-expense-tracker.vercel.app`)

Once you have saved these 3 settings, click on the **Deployments** tab and click **Redeploy** on the latest commit. Both your frontend and backend will build and run flawlessly on Vercel!
