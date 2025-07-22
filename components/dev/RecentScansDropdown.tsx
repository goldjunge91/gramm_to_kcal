/**
 * Dropdown component for showing recent barcode scans
 * Allows quick selection and form population for authenticated users
 */

'use client'

import type { JSX } from 'react'

import { Check, Clock, X } from 'lucide-react'
import { useState } from 'react'

import type { RecentScan } from '@/hooks/use-recent-scans'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface RecentScansDropdownProps {
  recentScans: RecentScan[]
  onSelect: (scan: RecentScan) => void
  onRemove?: (scanId: string) => void
  trigger: React.ReactNode
  placeholder?: string
  className?: string
}

export function RecentScansDropdown({
  recentScans,
  onSelect,
  onRemove,
  trigger,
  placeholder = 'Suche in letzten Scans...',
  className,
}: RecentScansDropdownProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const handleSelect = (scan: RecentScan) => {
    onSelect(scan)
    setOpen(false)
    setSearch('')
  }

  const handleRemove = (scanId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    onRemove?.(scanId)
  }

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Vor wenigen Minuten'
    }
    else if (diffInHours < 24) {
      return `Vor ${Math.floor(diffInHours)} Stunden`
    }
    else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `Vor ${diffInDays} Tag${diffInDays > 1 ? 'en' : ''}`
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className={className}>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {recentScans.length === 0
                ? 'Noch keine Scans vorhanden'
                : 'Keine passenden Scans gefunden'}
            </CommandEmpty>
            {recentScans.length > 0 && (
              <CommandGroup heading="Letzte Scans">
                {recentScans.map(scan => (
                  <CommandItem
                    key={scan.id}
                    value={scan.productName}
                    onSelect={() => handleSelect(scan)}
                    className="flex items-center justify-between p-3 cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {scan.productName}
                        </div>
                        <div className="text-xs text-muted-foreground space-x-2">
                          <span>
                            {scan.quantity}
                            g
                          </span>
                          <span>•</span>
                          <span>
                            {scan.kcal}
                            {' '}
                            kcal
                          </span>
                          {scan.barcode && (
                            <>
                              <span>•</span>
                              <span>
                                📱
                                {scan.barcode}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(scan.scannedAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                        onClick={() => handleSelect(scan)}
                      >
                        <Check className="h-3 w-3" />
                        <span className="sr-only">Auswählen</span>
                      </Button>
                      {onRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-60 hover:opacity-100 text-destructive"
                          onClick={e => handleRemove(scan.id, e)}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Entfernen</span>
                        </Button>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>

        {recentScans.length > 0 && (
          <div className="border-t p-2">
            <div className="text-xs text-muted-foreground text-center">
              {recentScans.length}
              {' '}
              von maximal 20 Scans gespeichert
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
