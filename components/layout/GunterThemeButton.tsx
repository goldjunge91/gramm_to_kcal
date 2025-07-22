'use client'

import { Sparkles } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Gunter theme toggle button */
export function GunterThemeButton() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before checking theme to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const isGunterActive = mounted && theme === 'gunter'

  const handleGunterToggle = () => {
    if (isGunterActive) {
      setTheme('light')
    }
    else {
      setTheme('gunter')
    }
  }

  // Show a consistent state during SSR/hydration
  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        aria-label="Gunter Sparkle Theme umschalten"
        className="transition-all duration-300"
        disabled
      >
        <Sparkles className="h-[1.2rem] w-[1.2rem] transition-all duration-300" />
        <span className="sr-only">Gunter Theme aktivieren</span>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleGunterToggle}
      aria-label="Gunter Sparkle Theme umschalten"
      className={cn(
        'transition-all duration-300',
        isGunterActive
        && 'bg-yellow-400 border-yellow-500 text-yellow-900 hover:bg-yellow-300 shadow-lg shadow-yellow-200',
      )}
    >
      <Sparkles
        className={cn(
          'h-[1.2rem] w-[1.2rem] transition-all duration-300',
          isGunterActive && 'animate-pulse text-yellow-900',
        )}
      />
      <span className="sr-only">
        {isGunterActive
          ? 'Gunter Theme deaktivieren'
          : 'Gunter Theme aktivieren'}
      </span>
    </Button>
  )
}
