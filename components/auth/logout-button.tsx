'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth-client'

export function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  return <Button onClick={logout}>Logout</Button>
}
