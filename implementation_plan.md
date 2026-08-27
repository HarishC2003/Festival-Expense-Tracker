# Deploy Express Backend to Vercel Serverless

This plan outlines the steps to deploy both your React frontend and Express backend together on Vercel, eliminating the need for a separate backend hosting service (like Render).

## User Review Required

> [!WARNING]
> Deploying an Express backend to Vercel converts it into a "Serverless Function". This works perfectly for REST APIs like yours, but you will need to change some settings in your Vercel Dashboard for this to work, because Vercel needs to build the frontend and host the backend simultaneously from the root of the project.

## Open Questions

None. If you approve this plan, I will make the code changes, and then provide you with the final Vercel Dashboard instructions.

## Proposed Changes

### Vercel Serverless Setup
#### [NEW] `api/index.ts`
Create the Vercel serverless entry point that exports your Express app.

#### [MODIFY] `backend/src/index.ts`
Modify the backend entry point to export the `app` object for Vercel, and only call `app.listen()` when running locally.

### Dependency Management
#### [MODIFY] `package.json` (Root)
Merge the backend dependencies into the root `package.json` so Vercel can install them when building the serverless functions.
Add a postinstall/build script that correctly builds the frontend into `frontend/dist`.

### Routing Configuration
#### [MODIFY] `vercel.json` (Root)
Configure Vercel rewrites to correctly route `/api/*` traffic to the serverless backend, and all other traffic to the React frontend for SPA routing.

## Verification Plan
1. I will make all the necessary code changes.
2. I will push the changes to GitHub.
3. I will give you 3 simple steps to update your Vercel Dashboard settings (Root Directory and Output Directory) so Vercel can host both the frontend and backend together.
