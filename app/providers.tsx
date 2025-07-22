'use client'

import type { JSX, ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { signOut, useSession } from '@/lib/auth/auth-client'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes cache
    },
  },
})

export function Providers({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

// Better Auth version - uses Better Auth useSession directly
export function useAuth() {
  const { data: session, isPending } = useSession()

  return {
    user: session?.user || null,
    loading: isPending,
    signOut: async () => {
      await signOut()
    },
  }
}
