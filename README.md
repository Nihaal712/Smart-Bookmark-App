# Smart Bookmark App

A modern bookmark manager built with Next.js, Supabase, and Tailwind CSS. Features Google OAuth authentication, real-time updates, and smart auto-title fetching.

## About the Documentation

This repository includes a `TASKS.md` and additional docs created as part of the assignment to demonstrate planning, architecture decisions, and security considerations (OAuth, RLS, Realtime).  
In a production team setting, this would typically live in internal docs rather than the public repo.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database & Auth:** Supabase (PostgreSQL + Auth)
- **Styling:** Tailwind CSS + shadcn/ui
- **Icons:** Lucide React
- **Notifications:** Sonner
- **Theme:** next-themes (dark mode support)

## Features

- 🔐 Google OAuth authentication
- 📚 Bookmark management (create, delete)
- 🎯 Smart auto-title fetching from URLs
- 🔄 Real-time updates across tabs
- 🌙 Dark mode support
- 📱 Responsive design

## Prerequisites

- Node.js 18+ and npm/yarn
- A Supabase account ([supabase.com](https://supabase.com))
- A Google Cloud Console project (for OAuth)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd smart-bookmark-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
     ```
   - Get these values from: **Supabase Dashboard → Settings → API**

4. Set up Supabase:
   - Run the migrations in `supabase/migrations/` (in order):
     - `20250218000001_create_bookmarks_schema.sql`
     - `20250218000002_bookmarks_rls.sql`
     - `20250218000003_bookmarks_realtime.sql`
   - Or use Supabase CLI: `npx supabase db push`

5. Configure Google OAuth:
   - Follow the guide in `docs/SECTION_2_GOOGLE_OAUTH_SETUP.md`
   - Enable Google provider in Supabase Dashboard → Authentication → Providers

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes |

**Note:** Both variables are prefixed with `NEXT_PUBLIC_` because they're used in client-side code. This is safe because Row Level Security (RLS) policies protect your data.

## Project Structure

```
├── app/
│   ├── (auth)/          # Auth route group
│   │   └── login/       # Login page
│   ├── (protected)/    # Protected route group
│   │   └── bookmarks/  # Bookmarks page
│   └── layout.tsx      # Root layout
├── lib/
│   └── supabase/       # Supabase client utilities
│       ├── server.ts   # Server-side client
│       ├── client.ts   # Client-side client
│       └── middleware.ts # Middleware client
├── components/         # React components
├── actions/            # Server Actions
├── hooks/              # Custom React hooks
├── types/              # TypeScript definitions
├── supabase/
│   └── migrations/    # Database migrations
└── docs/               # Documentation
```

## Architecture

- **Server Components:** Initial data fetching, session checks
- **Client Components:** Interactive UI, Realtime subscriptions
- **Server Actions:** Mutations (create/delete bookmarks)
- **Middleware:** Route protection and auth redirects
- **RLS:** Row Level Security ensures users only access their own data

## Documentation

- **Section 2 Setup:** `docs/SECTION_2_OVERVIEW.md`
- **Google OAuth:** `docs/SECTION_2_GOOGLE_OAUTH_SETUP.md`
- **Security:** `docs/SECTION_2_SECURITY_CONSIDERATIONS.md`

## Deployment

See `TASKS.md` Section 10 for deployment instructions (Vercel).

## License

MIT
