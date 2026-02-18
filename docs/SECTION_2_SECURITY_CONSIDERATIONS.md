# Section 2: Security Considerations

This document captures the security model for the Smart Bookmark App and a verification checklist.

---

## 1. Row Level Security (RLS)

- **Requirement:** RLS must prevent users from reading or modifying other users’ bookmarks.
- **Implementation:**
  - All access is restricted by `auth.uid() = user_id`.
  - SELECT, INSERT, and DELETE policies are defined in `supabase/migrations/20250218000002_bookmarks_rls.sql`.
  - There is no UPDATE policy (bookmarks are immutable after creation).
- **Verify:** In Supabase SQL Editor, run as a test user and confirm you cannot SELECT/INSERT/DELETE rows where `user_id` is different from the authenticated user.

---

## 2. Server Actions and session validation

- **Requirement:** Every Server Action that touches the database must validate the user session first.
- **Implementation:**
  - In `actions/bookmarks.ts` (and any future data actions):
    - Get the session via the Supabase **server** client (cookie-based).
    - If there is no session (or no user), return an error and do not perform the operation.
  - Never trust client-provided `user_id` for authorization; RLS enforces `user_id`, and the server client uses the session’s JWT so RLS applies.
- **Verify:** Ensure no Server Action that inserts/updates/deletes bookmarks runs without a prior session check.

---

## 3. Client-side Supabase client (anon key)

- **Requirement:** The client may use only the **anon** (public) key. Security must not rely on keeping the database “hidden” from the client.
- **Implementation:**
  - Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the browser client.
  - Do **not** use the service role key anywhere in frontend or in middleware that runs in the browser.
  - RLS ensures that with the anon key, users can only access their own data.
- **Verify:** Confirm that only the anon key is used in `lib/supabase/client.ts` and in any client-side Supabase usage.

---

## 4. Realtime subscription filtering

- **Requirement:** Realtime must not leak other users’ data.
- **Implementation:**
  - Subscribe to `postgres_changes` with a filter so only the current user’s rows are received, e.g.  
    `filter: 'user_id=eq.<current_user_id>'`.
  - RLS also applies to Realtime: Supabase only sends rows that pass RLS for the authenticated user, but the client-side filter is an extra safeguard and keeps payloads minimal.
- **Verify:** In the BookmarkList (or equivalent) component, ensure the subscription uses the logged-in user’s ID in the filter and that no other user’s bookmarks are shown.

---

## 5. No direct client-side database writes

- **Requirement:** All bookmark creation/deletion must go through Server Actions, not direct client-side Supabase inserts/deletes.
- **Implementation:**
  - The UI calls `createBookmark(url)` and `deleteBookmark(id)` Server Actions.
  - Server Actions use the Supabase **server** client and validate session before calling `.from('bookmarks').insert()` or `.delete()`.
- **Verify:** Search the codebase for `.from('bookmarks').insert(` or `.from('bookmarks').delete(` and ensure they only appear in server-side code (e.g. `actions/` or server components), not in client components.

---

## 6. Summary checklist

| Item | Status |
|------|--------|
| RLS prevents cross-user data access | ✓ Enforced by migrations |
| Server Actions validate user session before DB operations | ✓ To be enforced in `actions/bookmarks.ts` |
| Client uses anon key only (safe with RLS) | ✓ Documented; verify in `lib/supabase/client.ts` |
| Realtime subscription filtered by `user_id` | ✓ Documented; verify in BookmarkList subscription |

Apply these considerations when implementing and when adding new features (e.g. new tables or new Server Actions).
