import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './login-form'

export default async function LoginPage() {
  // Server Component: check if already authenticated
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to bookmarks if already authenticated
  if (user) {
    redirect('/bookmarks')
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Smart Bookmark App</h1>
          <p className="mt-2 text-muted-foreground">
            Save and organize your bookmarks with ease
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
