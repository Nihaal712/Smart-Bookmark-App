import { type NextRequest } from 'next/server'
import { createClient } from './lib/supabase/middleware'

/**
 * Middleware for route protection and authentication.
 * 
 * - Protects `/bookmarks` route (redirects to `/login` if unauthenticated)
 * - Redirects authenticated users away from `/login` to `/bookmarks`
 * - Allows public assets (`/_next`, `/favicon.ico`, etc.)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const { supabase, response } = await createClient(request)

  // Allow public assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public')
  ) {
    return response
  }

  // Check session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected route: /bookmarks
  if (pathname.startsWith('/bookmarks')) {
    if (!user) {
      // Redirect to login if not authenticated
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return Response.redirect(url)
    }
    return response
  }

  // Auth route: /login
  if (pathname.startsWith('/login')) {
    if (user) {
      // Redirect to bookmarks if already authenticated
      const url = request.nextUrl.clone()
      url.pathname = '/bookmarks'
      return Response.redirect(url)
    }
    return response
  }

  // Allow other routes (e.g., root `/`)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
