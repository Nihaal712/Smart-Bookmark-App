import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ProtectedHeader } from '@/components/protected-header'

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode
}) {
  // Server Component: check session and redirect if unauthenticated
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  // Note: Middleware also handles this, but this provides an extra check
  if (!user) {
    redirect('/login')
  }

  return (
    <>
      <ProtectedHeader />
      <main className="container py-6">{children}</main>
    </>
  )
}
