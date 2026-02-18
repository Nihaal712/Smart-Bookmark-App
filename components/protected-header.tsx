'use client'

import { useAuth } from '@/hooks/useAuth'
import { logout } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'

export function ProtectedHeader() {
  const { user, loading } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    // logout() redirects, so this won't execute, but set state for UI feedback
  }

  if (loading) {
    return (
      <header className="border-b bg-background">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-end px-4">
          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-semibold tracking-tight">
            Smart Bookmark App
          </h1>
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </header>
    )
  }

  return (
    <header className="border-b bg-background">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-end px-4">
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-semibold tracking-tight">
          Smart Bookmark App
        </h1>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <ThemeToggle />
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button
                onClick={handleLogout}
                disabled={loggingOut}
                variant="ghost"
                size="sm"
              >
                {loggingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
