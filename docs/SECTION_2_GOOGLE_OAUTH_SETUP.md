# Section 2: Google OAuth Setup

Follow these steps to enable **Sign in with Google** for the Smart Bookmark App using Supabase Auth.

---

## 1. Create a Google Cloud Console project

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Note your **Project name** (e.g. "Smart Bookmark App").

---

## 2. Enable Google OAuth 2.0 (Google Identity Services)

1. In the left sidebar, go to **APIs & Services** → **Library**.
2. Search for **Google Identity** or **Google+ API** (if needed).
3. Ensure **Google Identity Services** / OAuth consent is configured:
   - Go to **APIs & Services** → **OAuth consent screen**.
   - Choose **External** (or Internal for workspace-only).
   - Fill in App name, User support email, Developer contact.
   - Add scopes if required (Supabase typically needs `email`, `profile`, `openid`).
   - Save.

---

## 3. Create OAuth 2.0 credentials

1. Go to **APIs & Services** → **Credentials**.
2. Click **Create Credentials** → **OAuth client ID**.
3. Application type: **Web application**.
4. Name: e.g. "Smart Bookmark App Web".

### Authorized JavaScript origins (where OAuth is initiated)

Add every URL where your app runs:

| Environment | URL |
|-------------|-----|
| Local dev   | `http://localhost:3000` |
| Production  | `https://your-app.vercel.app` (replace with your Vercel URL after deployment) |

### Authorized redirect URIs (handled by Supabase)

Supabase receives the OAuth callback. Use your **Supabase project URL**:

- Format: `https://<project-ref>.supabase.co/auth/v1/callback`
- Example: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

Find your project ref in **Supabase Dashboard** → **Settings** → **API** → **Project URL** (the subdomain is the ref).

5. Click **Create**.
6. Copy the **Client ID** and **Client Secret** (you’ll need them in Supabase).

---

## 4. Configure Google provider in Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **Providers**.
3. Find **Google** and turn it **On**.
4. Paste:
   - **Client ID** (from Google Cloud Console).
   - **Client Secret** (from Google Cloud Console).
5. Supabase uses a default redirect URL; no need to change it unless you use a custom domain.
6. Click **Save**.

---

## 5. (Optional) Restrict Client ID to your domains

In Google Cloud Console → **Credentials** → your OAuth client:

- Keep **Authorized JavaScript origins** limited to your real app URLs (localhost + production).
- Keep **Authorized redirect URIs** limited to your Supabase callback URL.

This avoids misuse of your Client ID on other sites.

---

## 6. Verify

- In the app, open the login page and click “Sign in with Google”.
- You should be redirected to Google, then back to your app after consent.
- If you get “redirect_uri_mismatch”, double-check the Supabase callback URL in **Authorized redirect URIs** and that the Supabase project URL matches.

---

## Post-deployment (Vercel)

After deploying to Vercel:

1. Add your production URL to **Authorized JavaScript origins** in Google Cloud Console (e.g. `https://your-app.vercel.app`).
2. In Supabase: **Authentication** → **URL Configuration**:
   - Set **Site URL** to your production URL.
   - Add the same URL to **Redirect URLs** if needed.
3. Test the full OAuth flow on the production URL.

---

## Summary checklist

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] Web application OAuth client created
- [ ] Authorized JavaScript origins: `http://localhost:3000` (+ production URL later)
- [ ] Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
- [ ] Client ID and Client Secret copied to Supabase → Authentication → Providers → Google
- [ ] Google provider enabled and saved in Supabase
