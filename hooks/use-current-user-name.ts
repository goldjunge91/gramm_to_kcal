import { useSession } from '@/lib/auth-client'

export function useCurrentUserName() {
  const { data: session } = useSession()
  return session?.user?.name || '?'
}
