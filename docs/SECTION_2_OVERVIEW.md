# Section 2: Supabase Configuration — Overview

This folder contains everything for **TASKS.md Section 2**: Google OAuth, database schema, RLS, Realtime, and security.

---

## What’s included

| Item | Where | Notes |
|------|--------|------|
| **Google OAuth Setup** | [SECTION_2_GOOGLE_OAUTH_SETUP.md](./SECTION_2_GOOGLE_OAUTH_SETUP.md) | Step-by-step Google Cloud + Supabase Auth |
| **Database Schema** | `../supabase/migrations/20250218000001_create_bookmarks_schema.sql` | `bookmarks` table, indexes, URL check |
| **Row Level Security** | `../supabase/migrations/20250218000002_bookmarks_rls.sql` | SELECT, INSERT, DELETE policies |
| **Realtime Replication** | `../supabase/migrations/20250218000003_bookmarks_realtime.sql` | Add `bookmarks` to Realtime publication |
| **Security Considerations** | [SECTION_2_SECURITY_CONSIDERATIONS.md](./SECTION_2_SECURITY_CONSIDERATIONS.md) | RLS, session checks, anon key, Realtime filter |

---

## How to apply the migrations

### Option A: Supabase Dashboard (SQL Editor)

1. Open your project in [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**.
2. Run in order:
   - `supabase/migrations/20250218000001_create_bookmarks_schema.sql`
   - `supabase/migrations/20250218000002_bookmarks_rls.sql`
   - `supabase/migrations/20250218000003_bookmarks_realtime.sql`

### Option B: Supabase CLI (local or linked project)

From the project root:

```bash
npx supabase db push
```

Or, if you use migrations locally:

```bash
npx supabase migration up
```

---

## Realtime in the app

- **Publication:** `supabase_realtime` (Supabase default).
- **Table:** `public.bookmarks` is added to the publication so INSERT/DELETE are broadcast.
- **Client subscription:** Use `postgres_changes` with:
  - `schema: 'public'`, `table: 'bookmarks'`
  - `filter: 'user_id=eq.<current_user_id>'` so each user only receives their own changes.

Realtime is enabled at project level in **Settings → API → Realtime**; the migration only adds the `bookmarks` table to the publication.
