# Smart Bookmark App - Implementation Plan

## 0. Overall Architecture

### Folder Structure
- [ ] Create Next.js App Router structure with `app/` directory
- [ ] Set up `app/(auth)/` route group for login page
- [ ] Set up `app/(protected)/` route group for authenticated routes
- [ ] Create `app/(protected)/bookmarks/` for main bookmark list page
- [ ] Create `components/ui/` for shadcn/ui components
- [ ] Create `components/bookmarks/` for bookmark-specific components
- [ ] Create `lib/supabase/` for Supabase client utilities
- [ ] Create `lib/utils.ts` for shared utilities (cn helper)
- [ ] Create `actions/` directory for Server Actions
- [ ] Create `types/` directory for TypeScript definitions
- [ ] Create `hooks/` directory for custom React hooks (realtime subscription)

### Client vs Server Component Boundaries
- [ ] Root layout (`app/layout.tsx`) - Server Component (theme provider wrapper)
- [ ] Auth layout (`app/(auth)/layout.tsx`) - Server Component
- [ ] Protected layout (`app/(protected)/layout.tsx`) - Server Component (session check)
- [ ] Login page (`app/(auth)/login/page.tsx`) - Server Component (redirect if authenticated)
- [ ] Bookmarks page (`app/(protected)/bookmarks/page.tsx`) - Server Component (initial data fetch)
- [ ] BookmarkList component - Client Component (realtime subscription, optimistic updates)
- [ ] BookmarkForm component - Client Component (form state, validation)
- [ ] BookmarkItem component - Client Component (delete interaction)
- [ ] ThemeProvider wrapper - Client Component (next-themes requires client)

### Server Actions Usage
- [ ] `actions/bookmarks.ts` - createBookmark, deleteBookmark Server Actions
- [ ] Server Actions use Supabase server client (no client-side Supabase client for mutations)
- [ ] Server Actions include proper error handling and return typed responses
- [ ] Server Actions validate user session before any database operations
- [ ] Note: Realtime subscriptions and client state are the primary update mechanism
- [ ] Optional: Use `revalidatePath` if server-rendered data caching is relied upon

## 1. Project Initialization

### Next.js Setup
- [ ] Initialize Next.js project with `npx create-next-app@latest` (TypeScript, App Router, Tailwind CSS, ESLint)
- [ ] Verify `tsconfig.json` has strict mode enabled
- [ ] Verify `tailwind.config.ts` is properly configured
- [ ] Verify `postcss.config.js` exists for Tailwind processing
- [ ] Configure `next.config.js` for image domains (if needed for favicon fetching)

### shadcn/ui Initialization
- [ ] Run `npx shadcn@latest init` with TypeScript, Tailwind, default style
- [ ] Install required shadcn/ui components:
  - [ ] `button` - for actions (add, delete)
  - [ ] `input` - for URL input field
  - [ ] `card` - for bookmark item display
  - [ ] `skeleton` - for loading states
  - [ ] `toast` (via sonner) - for notifications
  - [ ] `dialog` or `alert-dialog` - for delete confirmation
- [ ] Verify `components.json` is created with correct paths

### Dependency Installation
- [ ] Install `@supabase/ssr` - cookie-based auth for App Router
- [ ] Install `@supabase/supabase-js` - Supabase client library
- [ ] Install `cheerio` - server-side HTML parsing for metadata extraction
- [ ] Install `sonner` - toast notification library
- [ ] Install `lucide-react` - icon library
- [ ] Install `next-themes` - dark mode support
- [ ] Install `zod` - schema validation (if not included with shadcn)
- [ ] Install `@types/node` and `@types/react` (if not auto-installed)
- [ ] Verify all dependencies are compatible with Next.js 14+ App Router

## 2. Supabase Configuration

### Project Creation
- [ ] Create new Supabase project at supabase.com
- [ ] Note project URL and anon key for environment variables
- [ ] Enable Row Level Security on all tables by default

### Google OAuth Setup
- [x] Create Google Cloud Console project
- [x] Enable Google OAuth 2.0 (Google Identity Services)
- [x] Create OAuth 2.0 credentials (Web application type)
- [x] Configure Authorized JavaScript origins (where OAuth is initiated):
  - [x] Add `http://localhost:3000` (development)
  - [x] Add production Vercel URL after deployment (e.g., `https://app-name.vercel.app`)
- [x] Configure Authorized redirect URIs (handled by Supabase):
  - [x] Add `https://<project-ref>.supabase.co/auth/v1/callback` (Supabase callback)
- [x] Copy Client ID and Client Secret
- [x] In Supabase Dashboard → Authentication → Providers → Google:
  - [x] Enable Google provider
  - [x] Paste Client ID and Client Secret
  - [x] Configure redirect URL (Supabase handles this automatically)
  - [x] Save configuration
  - **Guide:** `docs/SECTION_2_GOOGLE_OAUTH_SETUP.md`

### Database Schema
- [x] Create `bookmarks` table with columns:
  - [x] `id` (uuid, primary key, default gen_random_uuid())
  - [x] `user_id` (uuid, references auth.users(id), not null)
  - [x] `url` (text, not null)
  - [x] `title` (text, not null)
  - [x] `created_at` (timestamptz, default now())
  - [x] `updated_at` (timestamptz, default now())
- [x] Create unique constraint on `(user_id, url)` to prevent duplicate bookmarks per user
- [x] Create index on `user_id` for query performance
- [x] Create index on `created_at DESC` for ordered listing
- [x] Add check constraint to ensure URL starts with `http://` or `https://` (protocol-only validation, minimal safety net)
- [x] Note: Full URL validation (domain, hostname, etc.) happens at Server Action level (see Section 5)
- [x] Enable Realtime replication on `bookmarks` table (Supabase Dashboard → Database → Replication)
  - **Migrations:** `supabase/migrations/20250218000001_create_bookmarks_schema.sql`, `20250218000003_bookmarks_realtime.sql`

### Row Level Security Policies
- [x] Create policy: Users can SELECT their own bookmarks
  - Policy name: `Users can view own bookmarks`
  - Operation: SELECT
  - Expression: `auth.uid() = user_id`
- [x] Create policy: Users can INSERT their own bookmarks
  - Policy name: `Users can insert own bookmarks`
  - Operation: INSERT
  - Expression: `auth.uid() = user_id`
- [x] Create policy: Users can DELETE their own bookmarks
  - Policy name: `Users can delete own bookmarks`
  - Operation: DELETE
  - Expression: `auth.uid() = user_id`
- [x] Verify no UPDATE policy exists (bookmarks are immutable after creation)
- [ ] Test RLS policies using Supabase SQL editor with test queries
  - **Migration:** `supabase/migrations/20250218000002_bookmarks_rls.sql`

### Realtime Replication Setup
- [x] Enable Realtime for `bookmarks` table in Supabase Dashboard (or via migration)
- [x] Verify Realtime is enabled at project level (Settings → API → Realtime)
- [x] Plan subscription to `postgres_changes` event type
- [x] Configure subscription filter: `schema: 'public', table: 'bookmarks', filter: 'user_id=eq.<current_user_id>'`
  - **Migration:** `supabase/migrations/20250218000003_bookmarks_realtime.sql`; **Overview:** `docs/SECTION_2_OVERVIEW.md`

### Security Considerations
- [x] Verify RLS policies prevent cross-user data access
- [x] Ensure Server Actions validate user session before database operations
- [x] Verify client-side Supabase client uses anon key (safe due to RLS)
- [x] Ensure Realtime subscription filters by user_id to prevent data leakage
  - **Doc:** `docs/SECTION_2_SECURITY_CONSIDERATIONS.md`

## 3. Environment & Configuration

### Required Environment Variables
- [x] Create `.env.local` for local development:
  - [x] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- [x] Create `.env.example` with placeholder values (no secrets)
- [x] Document environment variables in README
- [x] Add `.env.local` to `.gitignore` (already in `.gitignore`)

### Supabase SSR Client Setup
- [x] Create `lib/supabase/server.ts` - server-side Supabase client
  - [x] Use `createServerClient` from `@supabase/ssr`
  - [x] Configure cookie handling (get/set cookies)
  - [x] Export function to get server client instance
- [x] Create `lib/supabase/client.ts` - client-side Supabase client
  - [x] Use `createBrowserClient` from `@supabase/ssr`
  - [x] Export singleton client instance
- [x] Create `lib/supabase/middleware.ts` - middleware Supabase client
  - [x] Use `createServerClient` with request/response for middleware context
  - [x] Export function for middleware usage

### Middleware Planning
- [x] Create `middleware.ts` at project root
- [x] Use Supabase middleware client to check session
- [x] Protect `/bookmarks` route (redirect to `/login` if unauthenticated)
- [x] Allow `/login` route (redirect to `/bookmarks` if authenticated)
- [x] Allow public assets (`/_next`, `/favicon.ico`, etc.)
- [x] Set cache headers appropriately

## 4. Authentication Flow

### Login UX Flow
- [x] Create `/login` page with Google OAuth button
- [x] Use shadcn/ui Button component styled as OAuth button
- [x] Display app branding/title on login page
- [x] Show loading state during OAuth redirect
- [x] Handle error states (OAuth failure, network errors)

### Session Handling
- [x] Server Components use server Supabase client to check session
- [x] Client Components use client Supabase client for reactive session state
- [x] Create `hooks/useAuth.ts` custom hook for client-side session management
- [x] Hook returns `user`, `loading`, `error` states
- [x] Hook subscribes to auth state changes via Supabase auth listener

### Redirect Logic
- [x] Unauthenticated users accessing `/bookmarks` → redirect to `/login` (handled by middleware + protected layout)
- [x] Authenticated users accessing `/login` → redirect to `/bookmarks` (handled by middleware + login page)
- [x] After successful OAuth callback → redirect to `/bookmarks` (handled by `/auth/callback` route)
- [x] After logout → redirect to `/login` (handled by logout Server Action)
- [x] Use `redirect()` from `next/navigation` in Server Components
- [x] Use `useRouter()` in Client Components for client-side redirects (OAuth flow)

### Logout Behavior
- [x] Create logout Server Action in `actions/auth.ts`
- [x] Server Action calls `supabase.auth.signOut()`
- [x] Server Action clears cookies via Supabase SSR client (handled by signOut)
- [x] Server Action redirects to `/login`
- [x] Add logout button in protected layout (header/navbar)
- [x] Show user email/avatar in header when authenticated

## 5. Bookmark Creation (Server-First)

### Server Action Design
- [x] Create `createBookmark` Server Action in `actions/bookmarks.ts`
- [x] Action accepts `url: string` parameter
- [x] Action validates user session (throw error if not authenticated)
- [x] Action validates URL format (basic validation, allow http/https)
- [x] Action returns typed response: `{ success: boolean, data?: Bookmark, error?: string }`
- [x] Handle unique constraint violation (duplicate URL) with user-friendly error message

### URL Validation
- [x] Perform full URL validation at Server Action level (database constraint only checks protocol)
- [x] Use `new URL()` constructor for parsing and validation
- [x] Ensure URL has http:// or https:// protocol (protocol allowlist)
- [x] Reject invalid URLs that fail `new URL()` parsing with user-friendly error message
- [x] Keep validation minimal to avoid rejecting valid URLs (e.g., localhost, IP addresses, uncommon domains)

### Smart Auto-Title Fetching
- [x] Use `cheerio` to fetch and parse HTML metadata
- [x] Fetch priority order:
  1. `<meta property="og:title">` (Open Graph)
  2. `<title>` tag
  3. `<meta name="title">`
  4. Fallback to URL domain/hostname
- [x] Handle fetch errors gracefully (network timeout, 404, etc.)
- [x] Set timeout for fetch requests (5-10 seconds max)
- [x] Strip HTML tags and normalize whitespace in title
- [x] Truncate title to reasonable length (200 characters)
- [x] Store fetched title in database

### Error Handling and Fallbacks
- [x] If title fetch fails → use URL as title
- [x] If URL validation fails → return error to client
- [x] If database insert fails → return error to client
- [x] If user session invalid → return authentication error
- [x] All errors return user-friendly messages (no stack traces)

### Security Considerations
- [x] Never allow client-side direct database inserts
- [x] All inserts go through Server Actions
- [x] Server Actions verify user session on every call (see Section 2 Security Considerations)
- [x] Server Actions use RLS-protected Supabase client with anon key
- [x] Validate URL to prevent SSRF attacks (whitelist protocols, validate hostname)
- [x] Sanitize title before storing (prevent XSS in stored data)

## 6. Bookmark Listing & UI

### Client Component Responsibilities
- [x] BookmarkList component manages local state for bookmarks array
- [x] Component fetches initial data via props from Server Component parent
- [ ] Component sets up Realtime subscription on mount
- [x] Component handles optimistic updates for user actions
- [ ] Component reconciles Realtime events with local state

### Loading States
- [x] Show skeleton loaders while initial data loads
- [x] Use shadcn/ui Skeleton component
- [x] Display 3-5 skeleton bookmark cards
- [x] Hide skeletons when data arrives or error occurs

### Empty States
- [x] Show empty state when user has no bookmarks
- [x] Display friendly message: "No bookmarks yet"
- [x] Show call-to-action: "Add your first bookmark"
- [x] Include illustration or icon (lucide-react)

### Responsive Layout
- [x] Use Tailwind responsive classes (mobile-first)
- [x] Grid layout: 1 column on mobile, 2-3 columns on tablet, 3-4 columns on desktop
- [x] Bookmark cards have consistent height and spacing
- [x] Form input is full-width on mobile, constrained on desktop
- [x] Header/navbar is responsive (hamburger menu if needed)

### Dark Mode Considerations
- [x] Use next-themes ThemeProvider in root layout
- [x] Add theme toggle button in header
- [x] Test all components in light and dark modes
- [x] Ensure proper contrast ratios for accessibility
- [x] Use Tailwind dark: variants for dark mode styles
- [x] Persist theme preference in localStorage (handled by next-themes)

## 7. Realtime Updates (Critical Section)

### Supabase `postgres_changes` Subscription Plan
- [x] Subscribe to `postgres_changes` event in BookmarkList component
- [x] Event filter: `schema: 'public', table: 'bookmarks'`
- [x] Additional filter: `filter: 'user_id=eq.${userId}'` (client-side filter for security)
- [x] Listen for INSERT and DELETE events (no UPDATE needed)
- [x] Use Supabase Realtime client from `@supabase/supabase-js`

### Subscription Lifecycle Management
- [x] Create subscription in `useEffect` hook on component mount
- [x] Store subscription reference in component state or ref
- [x] Unsubscribe in `useEffect` cleanup function
- [x] Handle component unmount gracefully (prevent memory leaks)
- [x] Re-subscribe if userId changes (user switches accounts)

### Cleanup to Prevent Memory Leaks
- [x] Always call `subscription.unsubscribe()` in cleanup
- [x] Remove event listeners before component unmount
- [x] Clear any timers or intervals related to Realtime
- [ ] Verify no orphaned subscriptions in browser DevTools

### Optimistic UI Strategy
- [x] When user creates bookmark → immediately add to local state with temporary ID
- [x] Show loading indicator on optimistic bookmark item
- [x] When Server Action succeeds → replace optimistic item with real data (match by URL or temp ID)
- [x] When Server Action fails → remove optimistic item, show error toast
- [x] When user deletes bookmark → immediately remove from local state
- [x] If delete Server Action fails → restore item, show error toast

### Duplicate Event Prevention
- [x] Use bookmark `id` (primary key) to deduplicate events
- [x] For INSERT events: skip if bookmark with same `id` already exists in local state
- [x] For DELETE events: skip if bookmark with same `id` doesn't exist in local state
- [x] For optimistic inserts: match by URL when replacing temporary ID with real ID

### Race Condition Handling
- [x] Use functional state updates (`setState(prev => ...)`) to avoid stale closures
- [x] Handle case where optimistic insert completes before Realtime INSERT event arrives
- [x] Handle case where Realtime DELETE arrives before optimistic delete completes
- [x] Match optimistic updates by URL when ID reconciliation is needed

### Multi-Tab Consistency Guarantees
- [ ] Each tab maintains independent subscription
- [ ] Realtime events broadcast to all tabs simultaneously
- [ ] All tabs receive same events (Supabase handles this)
- [ ] Test with 2+ tabs open, verify changes sync across tabs
- [ ] Verify no infinite loops when one tab updates trigger other tabs

### How Optimistic Inserts Reconcile with Realtime Payloads
- [x] Optimistic insert uses temporary ID (e.g., `temp-${Date.now()}`)
- [x] Server Action returns created bookmark with real ID
- [x] Replace optimistic item when Server Action response arrives (match by URL)
- [x] When Realtime INSERT event arrives, check if bookmark with same `id` already exists
- [x] If exists → ignore Realtime event (already handled optimistically)
- [x] If not exists → add bookmark (handles case where Server Action response was missed)

### Failure and Rollback Scenarios
- [x] If Server Action fails after optimistic insert → remove from UI, show error
- [x] If Realtime subscription fails → show connection error, attempt reconnection
- [x] If Realtime event processing fails → log error, don't crash component
- [x] User-facing error handling and rollback are primary (retries optional/best-effort)
- [x] Show user-friendly error messages for all failure cases
- [x] Provide manual refresh button as fallback if Realtime fails

## 8. Bookmark Deletion

### Server Action for Delete
- [x] Create `deleteBookmark` Server Action in `actions/bookmarks.ts`
- [x] Action accepts `id: string` parameter (bookmark ID)
- [x] Action validates user session
- [x] Action verifies bookmark belongs to user (RLS handles this, but double-check in action)
- [x] Action performs DELETE operation via Supabase server client
- [x] Action returns typed response: `{ success: boolean, error?: string }`

### Authorization Checks
- [x] Server Action checks user session before delete (see Section 2 Security Considerations)
- [x] RLS policy ensures users can only delete own bookmarks
- [ ] Verify RLS policy is working (test with SQL editor)

### UI Confirmation Flow
- [x] Show confirmation dialog before delete (shadcn/ui AlertDialog)
- [x] Display bookmark title/URL in confirmation message
- [x] Provide "Cancel" and "Delete" buttons
- [x] Show loading state during delete operation
- [x] Close dialog after successful delete

### Realtime Sync Behavior
- [x] Optimistic delete removes item immediately from UI
- [x] Realtime DELETE event confirms deletion (or restores if failed)
- [x] If delete fails → restore item in UI, show error toast
- [x] Other tabs receive DELETE event and remove item automatically
- [ ] Verify no duplicate delete events cause issues

## 9. UX & Polish

### Toast Notifications
- [x] Use sonner for toast notifications
- [x] Show success toast on bookmark creation
- [x] Show success toast on bookmark deletion
- [x] Show error toast on failed operations
- [ ] Show loading toast for long-running operations (optional)
- [x] Position toasts at bottom-right (or top-right)
- [x] Auto-dismiss after 3-5 seconds

### Animations
- [x] Add fade-in animation for new bookmark items (CSS transitions)
- [ ] Add fade-out animation for deleted items
- [x] Use Tailwind `transition` and `animate` utilities
- [x] Keep animations lightweight (< 300ms)
- [x] Ensure animations don't block user interactions
- [x] Respect `prefers-reduced-motion` media query

### Keyboard Shortcuts
- [x] Focus URL input with `/` key (when not typing in input)
- [x] Submit form with `Enter` key (when input focused)
- [x] Delete bookmark with `Delete` or `Backspace` key (when item focused)
- [x] Document keyboard shortcuts in UI (tooltip or help modal)

### Accessibility Considerations
- [x] Ensure proper ARIA labels on interactive elements
- [x] Maintain keyboard navigation flow
- [x] Ensure color contrast meets WCAG AA standards
- [x] Add focus indicators for keyboard users
- [x] Use semantic HTML (buttons, links, forms)
- [x] Provide alt text for icons (via aria-label)
- [ ] Test with screen reader (VoiceOver, NVDA)

## 10. Deployment

### GitHub Repository Setup
- [x] Initialize git repository (`git init`)
- [x] Create `.gitignore` (include `.env.local`, `node_modules`, `.next`)
- [ ] Create initial commit with project setup
- [ ] Create GitHub repository
- [ ] Push code to GitHub (main/master branch)
- [ ] Verify repository is public or has Vercel access

### Vercel Deployment Steps
- [ ] Sign in to Vercel with GitHub account
- [ ] Import GitHub repository
- [ ] Configure build settings:
  - [ ] Framework Preset: Next.js
  - [ ] Root Directory: `.` (if app is in root)
  - [ ] Build Command: `next build` (default)
  - [ ] Output Directory: `.next` (default)
- [ ] Add environment variables in Vercel dashboard:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Deploy project
- [ ] Verify deployment succeeds and app loads

### Environment Variable Configuration
- [ ] Copy all `.env.local` variables to Vercel
- [ ] Use same variable names (no changes needed)
- [ ] Mark `NEXT_PUBLIC_*` variables as public (they're exposed to client)
- [ ] Verify variables are available at build time and runtime

### OAuth Redirect Updates Post-Deployment
- [ ] Get Vercel deployment URL (e.g., `https://app-name.vercel.app`)
- [ ] Update Supabase Auth → URL Configuration:
  - [ ] Add Vercel URL to Site URL
  - [ ] Add Vercel URL to Redirect URLs (Supabase handles callback routing)
- [ ] Update Google Cloud Console OAuth credentials:
  - [ ] Add `https://<project-ref>.supabase.co/auth/v1/callback` to authorized redirect URIs (if not already added)
- [ ] Test OAuth flow on production URL
- [ ] Verify redirects work correctly after login
  - **Guide:** `docs/DEPLOYMENT.md`

## 11. Testing & Verification

### Manual Test Checklist
- [ ] User can log in with Google OAuth
- [ ] User is redirected to `/bookmarks` after login
- [ ] User can add a bookmark with URL
- [ ] Bookmark title is auto-fetched correctly
- [ ] Bookmark appears in list immediately (optimistic update)
- [ ] User can delete a bookmark
- [ ] Deleted bookmark disappears immediately
- [ ] User can log out
- [ ] Unauthenticated user cannot access `/bookmarks`
- [ ] Authenticated user cannot access `/login` (redirects)

### Multi-Tab Realtime Tests
- [ ] Open app in Tab 1, log in
- [ ] Open app in Tab 2 (same browser), verify auto-login
- [ ] Add bookmark in Tab 1
- [ ] Verify bookmark appears in Tab 2 within 1-2 seconds
- [ ] Delete bookmark in Tab 2
- [ ] Verify bookmark disappears in Tab 1 within 1-2 seconds
- [ ] Test with 3+ tabs open simultaneously
- [ ] Verify no duplicate bookmarks appear
- [ ] Verify no infinite update loops

### Auth Edge Cases
- [ ] Test OAuth flow with invalid credentials (should fail gracefully)
- [ ] Test session expiration (logout after inactivity)
- [ ] Test login when already logged in (should redirect)
- [ ] Test accessing protected route when logged out (should redirect)
- [ ] Test OAuth callback with invalid state/token (should handle error)

### Failure Scenarios
- [ ] Test adding bookmark with invalid URL (should show error)
- [ ] Test adding bookmark when offline (should show error, no optimistic update)
- [ ] Test deleting bookmark when offline (should show error, restore item)
- [ ] Test Realtime subscription failure (should show connection error)
- [ ] Test Server Action failure (should show error toast, rollback optimistic update)
- [ ] Test network timeout during title fetch (should use URL as fallback)

## 12. README Planning

### Sections to Include
- [ ] Project title and description
- [ ] Tech stack list (Next.js, Supabase, Tailwind, shadcn/ui, etc.)
- [ ] Features list (OAuth, bookmarks, realtime, etc.)
- [ ] Prerequisites (Node.js version, Supabase account, etc.)
- [ ] Installation instructions (clone, install deps, env setup)
- [ ] Environment variables documentation
- [ ] Local development setup steps
- [ ] Supabase setup instructions (database schema, RLS policies, OAuth)
- [ ] Deployment instructions (Vercel)
- [ ] Architecture overview
- [ ] Project structure explanation
- [ ] Key implementation details

### Architecture Explanation
- [ ] Explain Server Components vs Client Components usage
- [ ] Explain Server Actions pattern for mutations
- [ ] Explain Supabase SSR client setup (cookie-based auth)
- [ ] Explain Realtime subscription architecture
- [ ] Explain optimistic UI strategy
- [ ] Explain RLS security model

### Problems Faced & Solutions
- [ ] Realtime subscription cleanup (memory leaks) → useEffect cleanup
- [ ] Optimistic updates vs Realtime events (duplicates) → deduplication strategy
- [ ] Race conditions in multi-tab scenarios → event ordering and state management
- [ ] Session handling in App Router → Supabase SSR cookie management
- [ ] Title fetching failures → graceful fallbacks and error handling
- [ ] OAuth redirect configuration → multiple redirect URLs for dev/prod

### Future Improvements (GenAI Ideas - Optional)
- [ ] AI-powered bookmark categorization and tagging
- [ ] AI-generated summaries for bookmarked pages
- [ ] Smart bookmark search using semantic search (vector embeddings)
- [ ] AI suggestions for related bookmarks
- [ ] Automatic bookmark organization by topic
- [ ] AI-powered duplicate detection and merging
- [ ] Note: Mark all GenAI ideas clearly as "Future Enhancements" and "Optional"
