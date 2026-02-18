# Smart Bookmark App

A modern, realtime social bookmarking manager built with **Next.js 15** and **Supabase**. Features instant cross-device syncing, optimistic UI updates, and intelligent metadata fetching.

## About the Documentation

This repository includes a `TASKS.md` and additional docs created as part of the assignment to demonstrate planning, architecture decisions, and security considerations (OAuth, RLS, Realtime).  
In a production team setting, this would typically live in internal docs rather than the public repo.

## 🚀 Tech Stack

- **Framework:** Next.js 15 (App Router, Server Actions)
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Realtime)
- **Styling:** Tailwind CSS, shadcn/ui, Lucide React
- **Utilities:** Cheerio (metadata fetching), Zod (validation), Sonner (toasts)
- **Language:** TypeScript

## ✨ Key Features

- **Google OAuth:** Secure authentication via Supabase Auth.
- **Realtime Sync:** Bookmarks sync instantly across all open tabs and devices using Supabase Realtime.
- **Optimistic UI:** Instant feedback for adding/deleting bookmarks, with automatic rollback on failure.
- **Smart Titles:** Automatically fetches and sanitizes page titles from URLs.
- **Secure by Default:** Row Level Security (RLS) ensures users can only access their own data.
- **Responsive Design:** Mobile-first layout with dark mode support.

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+
- A Supabase project

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/smart-bookmark-app.git
cd smart-bookmark-app
npm install
```

### 2. Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase Setup
Run the following SQL in your Supabase SQL Editor to set up the schema and RLS:

```sql
-- Create table
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  url text not null,
  title text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table bookmarks enable row level security;

-- Policies
create policy "Users can view own bookmarks" on bookmarks
  for select using (auth.uid() = user_id);

create policy "Users can insert own bookmarks" on bookmarks
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks" on bookmarks
  for delete using (auth.uid() = user_id);

-- Enable Realtime
alter publication supabase_realtime add table bookmarks;
```

### 4. Run Locally
```bash
npm run dev
```
Visit `http://localhost:3000`.

## 🏗️ Architecture

### Server vs Client
- **Server Components:** Handle initial data fetching (`page.tsx`) and auth redirects (`layout.tsx`, `middleware.ts`).
- **Client Components:** Handle interactive elements (`BookmarkList`, `BookmarkForm`) and Realtime subscriptions.
- **Server Actions:** Handle mutations (`createBookmark`, `deleteBookmark`) to ensure secure, server-side validation and database access.

### Realtime & Optimistic UI
1. **User Action:** User adds a URL.
2. **Optimistic Update:** UI immediately adds a "fake" bookmark with a temporary ID.
3. **Server Action:** Validates data, fetches metadata, and inserts into DB.
4. **Reconciliation:**
   - **Success:** Replaces optimistic item with real data.
   - **Failure:** Removes optimistic item and shows error toast.
   - **Realtime Event:** If another tab adds a bookmark, the `postgres_changes` subscription catches it and updates the UI instantly.

### Security
- **RLS:** Database policies strictly enforce that users can only modify their own rows.
- **Middleware:** Protects the `/bookmarks` route and handles auth redirection.
- **Input Validation:** Server Actions validate URLs and block SSRF attempts (e.g., localhost, private IPs).

## 🐛 Problems Faced & What I Learned

- **Duplicate bookmarks appearing**
  - While adding bookmarks, I noticed that sometimes the same bookmark appeared twice, especially when multiple tabs were open.
  - *What I learned:* This happened because the UI was updating optimistically while Supabase Realtime was also sending an insert event.
  - *How I handled it:* I added simple checks to avoid adding a bookmark if it already exists in local state.

- **Delete not syncing across tabs**
  - When a bookmark was deleted in one browser tab, it didn’t disappear immediately in other open tabs.
  - *What I learned:* Supabase Realtime sends different payloads for `INSERT` and `DELETE` events, and delete events rely on `payload.old`.
  - *How I handled it:* I updated the Realtime delete handler to correctly read the deleted record ID and remove it from local state.

- **Slow or failed title fetching**
  - In some cases, fetching the page title for a URL took too long or failed completely.
  - *What I learned:* Network requests are unreliable and shouldn’t block the main user experience.
  - *How I handled it:* I added a timeout and used the website’s hostname as a fallback title when fetching fails.

## 🔮 Future Improvements (Optional)

- **AI Categorization:** Automatically tag bookmarks based on page content.
- **Smart Search:** Improve search using semantic matching instead of only keywords.
- **Archive Mode:** Save a snapshot of the webpage content for offline viewing.