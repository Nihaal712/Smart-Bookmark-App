# Deployment Guide (GitHub + Vercel)

This guide corresponds to **Section 10: Deployment** in `TASKS.md`.

---

## 1. GitHub repository setup

These steps are partially automated:

### 1.1 Initialize git

Already done for you:

- `git init` has been run in the project root.
- `.gitignore` already includes:
  - `.env.local`
  - `.env*.local`
  - `node_modules`
  - `.next`

You still need to:

1. Stage files and create the initial commit:

   ```bash
   git add .
   git commit -m "chore: initial Smart Bookmark App setup"
   ```

2. Create a GitHub repository (via GitHub UI).
3. Add the remote and push:

   ```bash
   git remote add origin git@github.com:<your-user>/<your-repo>.git
   git push -u origin main
   ```

4. Ensure the repo is **public** or that Vercel has access to it.

---

## 2. Vercel deployment steps

Once your GitHub repo is ready:

1. Go to [Vercel](https://vercel.com) and **sign in with GitHub**.
2. Click **“New Project” → “Import Git Repository”**.
3. Select your Smart Bookmark App repo.
4. Use these build settings (defaults are fine):

   - **Framework Preset**: Next.js  
   - **Root Directory**: `.`  
   - **Build Command**: `next build`  
   - **Output Directory**: `.next`

5. Add environment variables in the Vercel project settings:

   - `NEXT_PUBLIC_SUPABASE_URL`  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   Use the same values as in your local `.env.local`.

6. Deploy the project and confirm it builds and loads.

---

## 3. Environment variable configuration

In Vercel project settings:

- Copy all variables from `.env.local`:

  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- Use identical names (no changes required).
- `NEXT_PUBLIC_*` variables are safe to be public (they are already exposed to the client).
- After deployment, verify the app can:
  - Reach Supabase (no auth/network errors in the console).
  - Perform login and CRUD operations.

---

## 4. OAuth redirect updates post-deployment

Assume your Vercel URL is `https://your-app.vercel.app` (replace with your actual URL).

### 4.1 Supabase Auth URL configuration

In **Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: include `https://your-app.vercel.app` (and localhost URLs if needed).

### 4.2 Google Cloud Console

In your Google OAuth client (same one used for dev):

- Ensure the Supabase callback is present:
  - `https://<project-ref>.supabase.co/auth/v1/callback`
- For production, you usually **don’t** add the Vercel URL here directly, because Supabase handles the callback. The `redirectTo` in `signInWithOAuth` points back to your app after Supabase finishes auth.

### 4.3 Verify prod OAuth flow

Manually confirm:

- Login via Google on `https://your-app.vercel.app/login`.
- You are redirected to Google, then back to `/bookmarks`.
- Bookmarks load and realtime still works.

---

## 5. Mapping back to TASKS.md Section 10

- **GitHub Repository Setup**
  - `git init` → already run.
  - `.gitignore` → already present with required entries.
  - Initial commit, GitHub repo creation, and push → **manual**, see section 1.

- **Vercel Deployment Steps**
  - Sign in, import repo, configure build, and deploy → **manual**, see section 2.

- **Environment Variable Configuration**
  - Instructions to copy `.env.local` → Vercel → section 3.

- **OAuth Redirect Updates Post-Deployment**
  - Supabase + Google Console adjustments → section 4.

Use this doc side-by-side with `TASKS.md` to complete deployment steps in your own accounts.  
Nothing here modifies your Supabase, Google Cloud, or Vercel settings automatically; those remain manual and under your control.

