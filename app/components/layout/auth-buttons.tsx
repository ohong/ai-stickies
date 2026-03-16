'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/src/hooks/use-auth'
import { Button } from '@/components/ui/button'

export function AuthButtons() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth()

  if (isLoading) {
    return <div className="w-20 h-10" /> // Placeholder to prevent layout shift
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          {user.user_metadata?.avatar_url ? (
            <Image
              src={user.user_metadata.avatar_url}
              alt=""
              width={28}
              height={28}
              className="size-7 rounded-full"
            />
          ) : (
            <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
              {(user.email?.[0] ?? '?').toUpperCase()}
            </div>
          )}
          <span className="text-sm text-muted-foreground max-w-[120px] truncate">
            {user.user_metadata?.full_name ?? user.email}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
        >
          Log out
        </Button>
      </div>
    )
  }

  return (
    <Button size="sm" asChild>
      <Link href="/login">Sign in</Link>
    </Button>
  )
}
