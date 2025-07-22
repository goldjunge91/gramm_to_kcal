'use client'

import type { JSX } from 'react'

import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Loader2,
  Scan,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { Product } from '@/lib/types/types'

import { BarcodeScanner } from '@/components/BarcodeScanner'
import { RecentScansDropdown } from '@/components/dev/RecentScansDropdown'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRecentScans } from '@/hooks/use-recent-scans'
import { lookupProductByBarcode } from '@/lib/api/product-lookup'

interface ProductFormProps {
  onSubmit: (product: Omit<Product, 'id'>) => Promise<void>
  isLoading?: boolean
  compact?: boolean
  enableBarcode?: boolean
}

/** Form component for adding new products to compare */
export function ProductForm({
  onSubmit,
  isLoading = false,
  compact = false,
  enableBarcode = false,
}: ProductFormProps): JSX.Element {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [kcal, setKcal] = useState('')

  // Recent scans for authenticated users
  const { recentScans, addRecentScan, removeRecentScan, isAuthenticated }
    = useRecentScans()

  // Barcode scanning state
  const [showScanner, setShowScanner] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [scanResult, setScanResult] = useState<{
    barcode: string
    productData?: Omit<Product, 'id'>
    error?: string
  } | null>(null)

  // Handle barcode scan
  const handleBarcodeScan = async (barcode: string): Promise<void> => {
    setIsLookingUp(true)
    setScanResult({ barcode })

    try {
      const result = await lookupProductByBarcode(barcode)

      if (result.success && result.product) {
        // Auto-populate form with scanned data
        setName(result.product.name)
        setQuantity(result.product.quantity.toString())
        setKcal(result.product.kcal.toString())

        setScanResult({
          barcode,
          productData: result.product,
        })

        toast.success(`Produkt gefunden: ${result.product.name}`)
      }
      else {
        setScanResult({
          barcode,
          error: result.error || 'Produkt nicht gefunden',
        })
        toast.error(result.error || 'Produkt nicht in der Datenbank gefunden')
      }
    }
    catch (error) {
      const errorMessage
        = error instanceof Error
          ? error.message
          : 'Fehler beim Laden der Produktdaten'
      setScanResult({
        barcode,
        error: errorMessage,
      })
      toast.error(errorMessage)
    }
    finally {
      setIsLookingUp(false)
    }
  }

  // Handle recent scan selection
  const handleRecentScanSelect = (scan: (typeof recentScans)[0]): void => {
    setName(scan.productName)
    setQuantity(scan.quantity.toString())
    setKcal(scan.kcal.toString())

    // Clear any previous scan result
    setScanResult(null)

    toast.success(`Produkt aus letzten Scans geladen: ${scan.productName}`)
  }

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()

    const quantityNum = Number.parseFloat(quantity)
    const kcalNum = Number.parseFloat(kcal)

    if (
      !name.trim()
      || !quantityNum
      || quantityNum <= 0
      || !kcalNum
      || kcalNum <= 0
    ) {
      return
    }

    const productData = {
      name: name.trim(),
      quantity: quantityNum,
      kcal: kcalNum,
    }

    await onSubmit(productData)

    // Add to recent scans for authenticated users
    if (isAuthenticated) {
      addRecentScan(productData, scanResult?.barcode)
    }

    // Reset form
    setName('')
    setQuantity('')
    setKcal('')
    setScanResult(null)
  }

  const resetForm = (): void => {
    setName('')
    setQuantity('')
    setKcal('')
    setScanResult(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {enableBarcode
                ? 'Produkt scannen oder hinzufügen'
                : 'Neues Produkt hinzufügen'}
            </CardTitle>
            {enableBarcode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowScanner(true)}
                disabled={isLoading || isLookingUp}
                className="flex items-center gap-2"
              >
                {isLookingUp
                  ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )
                  : (
                      <Scan className="h-4 w-4" />
                    )}
                Scannen
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Scan Result Display */}
          {scanResult && (
            <div className="mb-4">
              {scanResult.productData
                ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Barcode gescannt:
                        {' '}
                        {scanResult.barcode}
                        <br />
                        Produkt automatisch erkannt und Daten eingefügt.
                      </AlertDescription>
                    </Alert>
                  )
                : scanResult.error
                  ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Barcode:
                          {' '}
                          {scanResult.barcode}
                          <br />
                          {scanResult.error}
                          {' '}
                          - Bitte Daten manuell eingeben.
                        </AlertDescription>
                      </Alert>
                    )
                  : (
                      <Alert>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertDescription>
                          Barcode:
                          {' '}
                          {scanResult.barcode}
                          <br />
                          Produktdaten werden geladen...
                        </AlertDescription>
                      </Alert>
                    )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}
            >
              <div
                className={`space-y-2 ${compact ? '' : 'sm:col-span-2 md:col-span-1'}`}
              >
                <Label htmlFor="name">Produktname</Label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="z.B. Vollkornbrot"
                    required
                    disabled={isLoading || isLookingUp}
                    className={
                      isAuthenticated && recentScans.length > 0 ? 'pr-10' : ''
                    }
                  />
                  {isAuthenticated && recentScans.length > 0 && (
                    <RecentScansDropdown
                      recentScans={recentScans}
                      onSelect={handleRecentScanSelect}
                      onRemove={removeRecentScan}
                      trigger={(
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                          disabled={isLoading || isLookingUp}
                        >
                          <ChevronDown className="h-4 w-4" />
                          <span className="sr-only">Letzte Scans anzeigen</span>
                        </Button>
                      )}
                      placeholder="Suche in letzten Scans..."
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Menge (g)</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="z.B. 100"
                  min="0"
                  step="0.1"
                  required
                  disabled={isLoading || isLookingUp}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kcal">Kalorien (kcal)</Label>
                <Input
                  id="kcal"
                  type="number"
                  value={kcal}
                  onChange={e => setKcal(e.target.value)}
                  placeholder="z.B. 250"
                  min="0"
                  step="0.1"
                  required
                  disabled={isLoading || isLookingUp}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 sm:flex-none sm:w-auto"
                aria-label="Produkt zur Vergleichstabelle hinzufügen"
                disabled={isLoading || isLookingUp}
              >
                {isLoading ? 'Wird hinzugefügt...' : 'Hinzufügen'}
              </Button>

              {(name || quantity || kcal || scanResult) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isLoading || isLookingUp}
                >
                  Zurücksetzen
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Barcode Scanner Modal */}
      {enableBarcode && (
        <BarcodeScanner
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={handleBarcodeScan}
          onError={(error) => {
            console.error('Scanner error:', error)
            toast.error(`Scanner-Fehler: ${error}`)
          }}
        />
      )}
    </>
  )
}
