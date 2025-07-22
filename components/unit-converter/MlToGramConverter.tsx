/**
 * ML zu Gramm Converter Komponente
 * Intelligente UI für die bidirektionale Umrechnung zwischen ml und g
 */

'use client'

import type { JSX } from 'react'

import { Calculator, ChevronDown, Info, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { DensityData } from '@/lib/utils/density-database'
import type { ConversionResult } from '@/lib/utils/unit-converter'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {

  getCategoryDisplayName,
  getDensityDataByCategory,
  searchDensityData,
} from '@/lib/utils/density-database'
import {

  convertUnits,
  formatNumber,
  getQuickConversions,
  parseNumberInput,
} from '@/lib/utils/unit-converter'

interface MlToGramConverterProps {
  className?: string
  compact?: boolean
  onConversionChange?: (result: ConversionResult) => void
  defaultSubstance?: string
  showQuickConversions?: boolean
}

export function MlToGramConverter({
  className = '',
  compact = false,
  onConversionChange,
  defaultSubstance = 'water',
  showQuickConversions = true,
}: MlToGramConverterProps): JSX.Element {
  // State für die Eingabefelder
  const [mlInput, setMlInput] = useState('')
  const [gramsInput, setGramsInput] = useState('')
  const [selectedSubstance, setSelectedSubstance] = useState(defaultSubstance)
  const [customDensity, setCustomDensity] = useState('')
  const [useCustomDensity, setUseCustomDensity] = useState(false)

  // State für die UI
  const [substanceSearchOpen, setSubstanceSearchOpen] = useState(false)
  const [substanceSearch, setSubstanceSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('cooking')
  const [lastChangedField, setLastChangedField] = useState<'ml' | 'grams'>(
    'ml',
  )

  // Aktuelle Umrechnungsergebnisse
  const [conversionResult, setConversionResult]
    = useState<ConversionResult | null>(null)

  // Substanzen für die Auswahl basierend auf Kategorie und Suche
  const [availableSubstances, setAvailableSubstances] = useState<DensityData[]>(
    [],
  )

  // Aktualisiere verfügbare Substanzen basierend auf Kategorie und Suche
  useEffect(() => {
    if (substanceSearch.length >= 2) {
      setAvailableSubstances(searchDensityData(substanceSearch))
    }
    else {
      setAvailableSubstances(
        getDensityDataByCategory(selectedCategory as DensityData['category']),
      )
    }
  }, [selectedCategory, substanceSearch])

  // Führe Umrechnung durch
  const performConversion = useCallback(
    (fromValue: number, fromUnit: 'ml' | 'g') => {
      const toUnit = fromUnit === 'ml' ? 'g' : 'ml'

      const options = {
        substance: useCustomDensity ? undefined : selectedSubstance,
        customDensity: useCustomDensity
          ? parseNumberInput(customDensity) || undefined
          : undefined,
        precision: 2,
      }

      const result = convertUnits(fromValue, fromUnit, toUnit, options)
      setConversionResult(result)

      if (onConversionChange) {
        onConversionChange(result)
      }

      if (!result.success && result.error) {
        toast.error(result.error)
      }

      return result
    },
    [selectedSubstance, useCustomDensity, customDensity, onConversionChange],
  )

  // Handler für ML Eingabe
  const handleMlChange = useCallback(
    (value: string) => {
      setMlInput(value)
      setLastChangedField('ml')

      const numValue = parseNumberInput(value)
      if (numValue !== null) {
        const result = performConversion(numValue, 'ml')
        if (result.success) {
          setGramsInput(formatNumber(result.value))
        }
      }
      else if (value === '') {
        setGramsInput('')
        setConversionResult(null)
      }
    },
    [performConversion],
  )

  // Handler für Gramm Eingabe
  const handleGramsChange = useCallback(
    (value: string) => {
      setGramsInput(value)
      setLastChangedField('grams')

      const numValue = parseNumberInput(value)
      if (numValue !== null) {
        const result = performConversion(numValue, 'g')
        if (result.success) {
          setMlInput(formatNumber(result.value))
        }
      }
      else if (value === '') {
        setMlInput('')
        setConversionResult(null)
      }
    },
    [performConversion],
  )

  // Handler für Substanzwechsel
  const handleSubstanceChange = useCallback(
    (substance: string) => {
      setSelectedSubstance(substance)
      setSubstanceSearchOpen(false)
      setUseCustomDensity(substance === 'custom')

      // Umrechnung mit neuer Substanz durchführen
      if (mlInput || gramsInput) {
        if (lastChangedField === 'ml' && mlInput) {
          handleMlChange(mlInput)
        }
        else if (lastChangedField === 'grams' && gramsInput) {
          handleGramsChange(gramsInput)
        }
      }
    },
    [mlInput, gramsInput, lastChangedField, handleMlChange, handleGramsChange],
  )

  // Felder zurücksetzen
  const resetFields = useCallback(() => {
    setMlInput('')
    setGramsInput('')
    setConversionResult(null)
    setCustomDensity('')
  }, [])

  // Schnellwerte für die aktuelle Substanz
  const quickConversions = getQuickConversions(selectedSubstance)

  return (
    <Card className={className}>
      <CardHeader className={compact ? 'pb-3' : undefined}>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          ML zu Gramm Umrechner
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Substanz-Auswahl */}
        <div className="space-y-2">
          <Label>Substanz auswählen</Label>
          <div className="flex gap-2">
            <Popover
              open={substanceSearchOpen}
              onOpenChange={setSubstanceSearchOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={substanceSearchOpen}
                  className="flex-1 justify-between"
                >
                  {selectedSubstance === 'custom'
                    ? 'Benutzerdefiniert'
                    : availableSubstances.find(
                      s => s.name === selectedSubstance,
                    )?.nameDE || 'Wasser'}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <Tabs
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="cooking">Küche</TabsTrigger>
                    <TabsTrigger value="chemistry">Labor</TabsTrigger>
                  </TabsList>

                  <Command>
                    <CommandInput
                      placeholder="Substanz suchen..."
                      value={substanceSearch}
                      onValueChange={setSubstanceSearch}
                    />
                    <CommandList>
                      <CommandEmpty>Keine Substanz gefunden.</CommandEmpty>

                      <CommandGroup
                        heading={getCategoryDisplayName(
                          selectedCategory as DensityData['category'],
                        )}
                      >
                        {availableSubstances.map(substance => (
                          <CommandItem
                            key={substance.name}
                            value={substance.name}
                            onSelect={() =>
                              handleSubstanceChange(substance.name)}
                          >
                            <div className="flex flex-col">
                              <div className="font-medium">
                                {substance.nameDE}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {substance.density}
                                {' '}
                                g/ml
                                {substance.temperature
                                  && ` @ ${substance.temperature}°C`}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>

                      <Separator />
                      <CommandGroup heading="Erweitert">
                        <CommandItem
                          value="custom"
                          onSelect={() => handleSubstanceChange('custom')}
                        >
                          <div className="flex flex-col">
                            <div className="font-medium">
                              Benutzerdefinierte Dichte
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Eigene Dichte eingeben
                            </div>
                          </div>
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </Tabs>
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="icon" onClick={resetFields}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Benutzerdefinierte Dichte */}
        {useCustomDensity && (
          <div className="space-y-2">
            <Label htmlFor="custom-density">Dichte (g/ml)</Label>
            <Input
              id="custom-density"
              type="number"
              step="0.001"
              min="0"
              value={customDensity}
              onChange={e => setCustomDensity(e.target.value)}
              placeholder="z.B. 1.25"
              className="w-full"
            />
          </div>
        )}

        {/* Umrechnung */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ml-input">Milliliter (ml)</Label>
            <Input
              id="ml-input"
              type="number"
              step="0.1"
              min="0"
              value={mlInput}
              onChange={e => handleMlChange(e.target.value)}
              placeholder="z.B. 250"
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grams-input">Gramm (g)</Label>
            <Input
              id="grams-input"
              type="number"
              step="0.1"
              min="0"
              value={gramsInput}
              onChange={e => handleGramsChange(e.target.value)}
              placeholder="z.B. 250"
              className="text-lg"
            />
          </div>
        </div>

        {/* Umrechnungsergebnis */}
        {conversionResult && conversionResult.success && (
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {conversionResult.formula}
                </div>
                {conversionResult.substance && (
                  <div className="text-xs text-muted-foreground">
                    Substanz:
                    {' '}
                    {conversionResult.substance.nameDE}
                    (
                    {conversionResult.substance.density}
                    {' '}
                    g/ml)
                    {conversionResult.substance.temperature
                      && ` bei ${conversionResult.substance.temperature}°C`}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Schnellwerte */}
        {showQuickConversions && !compact && (
          <div className="space-y-2">
            <Label>Schnellwerte</Label>
            <div className="grid grid-cols-2 gap-2">
              {quickConversions.slice(0, 6).map(conversion => (
                <Button
                  key={conversion.ml}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMlInput(conversion.ml.toString())
                    handleMlChange(conversion.ml.toString())
                  }}
                  className="text-xs"
                >
                  {conversion.label}
                  {' '}
                  =
                  {conversion.grams}
                  g
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
