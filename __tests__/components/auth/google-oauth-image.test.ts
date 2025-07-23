/**
 * Test: Google OAuth Image Loading
 * TDD Red Phase - Test that Google profile images load correctly
 */

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CurrentUserAvatar } from '@/components/auth/current-user-avatar'

// Mock the auth hooks
vi.mock('@/hooks/use-current-user-image', () => ({
  useCurrentUserImage: vi.fn(),
}))

vi.mock('@/hooks/use-current-user-name', () => ({
  useCurrentUserName: vi.fn(),
}))

describe('Google OAuth Image Loading', () => {
  it('should display Google profile image when available', async () => {
    const { useCurrentUserImage } = await import('@/hooks/use-current-user-image')
    const { useCurrentUserName } = await import('@/hooks/use-current-user-name')
    
    // Mock Google profile image URL
    const googleImageUrl = 'https://lh3.googleusercontent.com/a-/AOh14Gh_test_image_url'
    
    vi.mocked(useCurrentUserImage).mockReturnValue(googleImageUrl)
    vi.mocked(useCurrentUserName).mockReturnValue('John Doe')
    
    render(<CurrentUserAvatar />)
    
    // Should render image with correct src
    const avatarImage = screen.getByRole('img')
    expect(avatarImage).toHaveAttribute('src', googleImageUrl)
    expect(avatarImage).toHaveAttribute('alt', 'JD')
  })

  it('should show fallback initials when image fails to load', async () => {
    const { useCurrentUserImage } = await import('@/hooks/use-current-user-image')
    const { useCurrentUserName } = await import('@/hooks/use-current-user-name')
    
    vi.mocked(useCurrentUserImage).mockReturnValue(null)
    vi.mocked(useCurrentUserName).mockReturnValue('John Doe')
    
    render(<CurrentUserAvatar />)
    
    // Should show fallback with initials
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('should handle various Google image URL formats', async () => {
    const { useCurrentUserImage } = await import('@/hooks/use-current-user-image')
    const { useCurrentUserName } = await import('@/hooks/use-current-user-name')
    
    const googleImageUrls = [
      'https://lh3.googleusercontent.com/a-/AOh14Gh_test1',
      'https://lh4.googleusercontent.com/a-/AOh14Gh_test2', 
      'https://lh5.googleusercontent.com/a-/AOh14Gh_test3',
      'https://lh6.googleusercontent.com/a-/AOh14Gh_test4',
    ]
    
    vi.mocked(useCurrentUserName).mockReturnValue('Test User')
    
    for (const url of googleImageUrls) {
      vi.mocked(useCurrentUserImage).mockReturnValue(url)
      
      const { rerender } = render(<CurrentUserAvatar />)
      
      const avatarImage = screen.getByRole('img')
      expect(avatarImage).toHaveAttribute('src', url)
      
      rerender(<div />)
    }
  })
})