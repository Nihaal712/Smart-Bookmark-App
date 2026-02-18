import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for client-side usage (Client Components, hooks).
 * Uses browser-based authentication via @supabase/ssr.
 * 
 * This is a singleton instance that should be used in:
 * - Client Components (for Realtime subscriptions, reactive auth state)
 * - Custom hooks (e.g., useAuth)
 * 
 * Note: Uses the anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY) which is safe
 * because Row Level Security (RLS) policies restrict data access.
 * 
 * @returns Supabase client instance configured for browser usage
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
