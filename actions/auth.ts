'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Logout Server Action.
 * Signs out the user, clears cookies, and redirects to login.
 */
export async function logout() {
  const supabase = await createClient()
  
  // Sign out (clears session)
  await supabase.auth.signOut()
  
  // Redirect to login page
  redirect('/login')
}
