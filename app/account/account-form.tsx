'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signOut } from '@/lib/auth-client'

interface AccountFormProps {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
    emailVerified: boolean
  }
}

export default function AccountForm({ user }: AccountFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
      router.push('/auth/login')
      router.refresh()
    }
    catch (error) {
      console.error('Sign out error:', error)
    }
    finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Your account details from Better Auth
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={user.name}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="id">User ID</Label>
            <Input
              id="id"
              value={user.id}
              disabled
              className="bg-muted text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label>Email Verified</Label>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.emailVerified
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
              >
                {user.emailVerified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
          </div>

          {user.image && (
            <div className="space-y-2">
              <Label>Profile Image</Label>
              <div className="flex items-center space-x-3">
                <img
                  src={user.image}
                  alt="Profile"
                  className="w-10 h-10 rounded-full"
                />
                <span className="text-sm text-muted-foreground">
                  Profile image from OAuth provider
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>
            Manage your account settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSignOut}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? 'Signing out...' : 'Sign Out'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
