import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

/**
 * OAuth callback handler.
 * Supabase redirects here after successful OAuth authentication.
 * We exchange the code for a session, then redirect to /bookmarks.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/bookmarks'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to the bookmarks page (or next param if provided)
  return NextResponse.redirect(new URL(next, request.url))
}
