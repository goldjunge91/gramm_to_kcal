import { useSession } from '@/lib/auth-client'

export function useCurrentUserImage() {
  const { data: session } = useSession()
  return session?.user?.image || null
}
