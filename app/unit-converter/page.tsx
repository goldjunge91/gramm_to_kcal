/**
 * ML zu Gramm Umrechner - Produktionsreife Seite
 * Professionelles Tool für die Umrechnung zwischen Millilitern und Gramm
 */

'use client'

import {
  Beaker,
  Calculator,
  ChefHat,
  Download,
  Heart,
  HelpCircle,
  History,
  Info,
  Share2,
  Star,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { ConversionResult } from '@/lib/utils/unit-converter'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MlToGramConverter } from '@/components/unit-converter/MlToGramConverter'
import { getDensityDataByCategory } from '@/lib/utils/density-database'

export default function UnitConverterPage() {
  // State Management
  const [conversionHistory, setConversionHistory] = useState<
    ConversionResult[]
  >([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [faqOpen, setFaqOpen] = useState<Record<string, boolean>>({})

  // Load saved data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('unit-converter-history')
      const savedFavorites = localStorage.getItem('unit-converter-favorites')

      if (savedHistory) {
        try {
          setConversionHistory(JSON.parse(savedHistory))
        }
        catch (error) {
          console.warn('Failed to load conversion history:', error)
        }
      }

      if (savedFavorites) {
        try {
          setFavorites(JSON.parse(savedFavorites))
        }
        catch (error) {
          console.warn('Failed to load favorites:', error)
        }
      }
    }
  }, [])

  // Save to localStorage when data changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'unit-converter-history',
        JSON.stringify(conversionHistory),
      )
    }
  }, [conversionHistory])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'unit-converter-favorites',
        JSON.stringify(favorites),
      )
    }
  }, [favorites])

  const handleConversionChange = (result: ConversionResult) => {
    if (result.success) {
      setConversionHistory(prev => [result, ...prev.slice(0, 9)]) // Behalte nur die letzten 10
    }
  }

  // Favorites Management
  const toggleFavorite = (substance: string) => {
    setFavorites(prev =>
      prev.includes(substance)
        ? prev.filter(fav => fav !== substance)
        : [...prev, substance],
    )
    toast.success(
      favorites.includes(substance)
        ? 'Aus Favoriten entfernt'
        : 'Zu Favoriten hinzugefügt',
    )
  }

  // Clear History
  const clearHistory = () => {
    setConversionHistory([])
    toast.success('Verlauf gelöscht')
  }

  // Export Functions
  const exportHistory = () => {
    if (conversionHistory.length === 0) {
      toast.error('Kein Verlauf zum Exportieren vorhanden')
      return
    }

    const csvContent = [
      ['Datum', 'Von', 'Nach', 'Substanz', 'Formel'].join(','),
      ...conversionHistory.map(result =>
        [
          new Date(result.timestamp || Date.now()).toLocaleDateString('de-DE'),
          `${result.originalValue} ${result.originalUnit}`,
          `${result.value} ${result.unit}`,
          result.substance?.nameDE || 'Wasser',
          `"${result.formula || ''}"`,
        ].join(','),
      ),
    ].join('\n')

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `umrechnungen-${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    toast.success('Verlauf als CSV exportiert')
  }

  // Share Function
  const shareConverter = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ML zu Gramm Umrechner',
          text: 'Konvertiere einfach zwischen Millilitern und Gramm für verschiedene Substanzen',
          url: window.location.href,
        })
      }
      catch (error) {
        console.log('Error sharing:', error)
      }
    }
    else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link in Zwischenablage kopiert')
    }
  }

  // FAQ Data
  const faqData = [
    {
      id: 'basic-conversion',
      question: 'Wie funktioniert die Umrechnung von ML zu Gramm?',
      answer:
        'Die Umrechnung basiert auf der Formel: Gewicht [g] = Volumen [ml] × Dichte [g/ml]. Die Dichte ist substanzspezifisch - Wasser hat beispielsweise eine Dichte von 1,0 g/ml, während Honig 1,4 g/ml hat.',
    },
    {
      id: 'accuracy',
      question: 'Wie genau sind die Umrechnungen?',
      answer:
        'Unsere Dichte-Datenbank basiert auf wissenschaftlichen Werten und ist sehr präzise. Beachten Sie jedoch, dass natürliche Schwankungen bei Lebensmitteln (z.B. Fettgehalt bei Milch) kleine Abweichungen verursachen können.',
    },
    {
      id: 'water-special',
      question: 'Warum ist Wasser ein Spezialfall?',
      answer:
        'Wasser hat bei Raumtemperatur (20°C) eine Dichte von genau 1,0 g/ml. Das bedeutet: 1 ml Wasser = 1 g Wasser. Dies macht Wasser zum einfachsten Umrechnungsfall.',
    },
    {
      id: 'cooking-tips',
      question: 'Welche Substanzen sind fürs Kochen wichtig?',
      answer:
        'Die wichtigsten Küchen-Umrechnungen sind: Milch (1,03 g/ml), Öl (0,92 g/ml), Honig (1,4 g/ml), und Sahne (1,01 g/ml). Diese verwenden Sie am häufigsten beim Backen und Kochen.',
    },
    {
      id: 'custom-density',
      question: 'Was ist wenn meine Substanz nicht in der Liste steht?',
      answer:
        'Verwenden Sie die "Benutzerdefinierte Dichte" Option! Suchen Sie die Dichte Ihrer Substanz online oder auf der Produktverpackung und geben Sie den Wert manuell ein.',
    },
  ]

  const toggleFaq = (id: string) => {
    setFaqOpen(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Calculator className="h-8 w-8 text-primary" />
                ML zu Gramm Umrechner
              </h1>
              <p className="text-muted-foreground mt-2">
                Professionelle Umrechnung zwischen Millilitern und Gramm für
                über 50 Substanzen
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={shareConverter}>
                <Share2 className="h-4 w-4 mr-2" />
                Teilen
              </Button>
              {conversionHistory.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportHistory}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Main Converter */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <MlToGramConverter
              onConversionChange={handleConversionChange}
              showQuickConversions={true}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Aktionen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={shareConverter}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  App teilen
                </Button>
                {conversionHistory.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={exportHistory}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Verlauf exportieren
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={clearHistory}
                    >
                      <History className="h-4 w-4 mr-2" />
                      Verlauf löschen
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Conversion History */}
            {conversionHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Letzte Umrechnungen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {conversionHistory.slice(0, 5).map((result, index) => (
                    <div
                      key={index}
                      className="text-sm border-l-2 border-primary/20 pl-3 py-1"
                    >
                      <div className="font-medium">
                        {result.originalValue}
                        {' '}
                        {result.originalUnit}
                        {' '}
                        →
                        {' '}
                        {result.value}
                        {' '}
                        {result.unit}
                      </div>
                      {result.substance && (
                        <div className="text-muted-foreground text-xs">
                          {result.substance.nameDE}
                        </div>
                      )}
                    </div>
                  ))}
                  {conversionHistory.length > 5 && (
                    <div className="text-xs text-muted-foreground text-center pt-2">
                      +
                      {conversionHistory.length - 5}
                      {' '}
                      weitere Umrechnungen
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Information Tabs */}
        <Tabs defaultValue="guide" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="guide" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Anleitung</span>
            </TabsTrigger>
            <TabsTrigger value="substances" className="flex items-center gap-2">
              <Beaker className="h-4 w-4" />
              <span className="hidden sm:inline">Substanzen</span>
            </TabsTrigger>
            <TabsTrigger value="cooking" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              <span className="hidden sm:inline">Küche</span>
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">FAQ</span>
            </TabsTrigger>
          </TabsList>

          {/* Guide Tab */}
          <TabsContent value="guide" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Grundlagen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      Formel
                    </Badge>
                    <p>Gewicht [g] = Volumen [ml] × Dichte [g/ml]</p>
                  </div>

                  <div>
                    <Badge variant="secondary" className="mb-2">
                      Beispiel
                    </Badge>
                    <p>250 ml Honig = 250 ml × 1,4 g/ml = 350 g</p>
                  </div>

                  <div>
                    <Badge variant="secondary" className="mb-2">
                      Tipp
                    </Badge>
                    <p>Für Wasser gilt: 1 ml = 1 g (bei Raumtemperatur)</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Häufige Dichten</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Wasser:</span>
                    <span className="font-mono">1,0 g/ml</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Milch:</span>
                    <span className="font-mono">1,03 g/ml</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Honig:</span>
                    <span className="font-mono">1,4 g/ml</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Speiseöl:</span>
                    <span className="font-mono">0,92 g/ml</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alkohol:</span>
                    <span className="font-mono">0,79 g/ml</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tipps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      Präzision
                    </Badge>
                    <p>
                      Verwenden Sie die richtige Dichte für genaueste
                      Ergebnisse.
                    </p>
                  </div>

                  <div>
                    <Badge variant="outline" className="mb-2">
                      Temperatur
                    </Badge>
                    <p>Dichte kann sich mit der Temperatur ändern.</p>
                  </div>

                  <div>
                    <Badge variant="outline" className="mb-2">
                      Favoriten
                    </Badge>
                    <p>
                      Speichern Sie häufig verwendete Substanzen als Favoriten.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Substances Tab */}
          <TabsContent value="substances" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(['cooking', 'chemistry', 'common'] as const).map((category) => {
                const substances = getDensityDataByCategory(category)
                const categoryNames = {
                  cooking: 'Kochen & Backen',
                  chemistry: 'Chemikalien',
                  common: 'Alltägliche Substanzen',
                }

                return (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {categoryNames[category]}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {substances.slice(0, 8).map(substance => (
                        <div
                          key={substance.name}
                          className="flex justify-between items-center text-sm"
                        >
                          <span>{substance.nameDE}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">
                              {substance.density}
                              {' '}
                              g/ml
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleFavorite(substance.name)}
                            >
                              <Heart
                                className={`h-3 w-3 ${
                                  favorites.includes(substance.name)
                                    ? 'fill-current text-red-500'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {substances.length > 8 && (
                        <div className="text-xs text-muted-foreground text-center pt-2">
                          +
                          {substances.length - 8}
                          {' '}
                          weitere verfügbar
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Cooking Tab */}
          <TabsContent value="cooking" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Häufige Küchen-Umrechnungen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="font-medium border-b pb-2">Backen:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <span>250ml Milch =</span>
                      <span className="font-mono">257g</span>
                      <span>100ml Honig =</span>
                      <span className="font-mono">140g</span>
                      <span>200ml Öl =</span>
                      <span className="font-mono">184g</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="font-medium border-b pb-2">Kochen:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <span>500ml Brühe =</span>
                      <span className="font-mono">500g</span>
                      <span>150ml Sahne =</span>
                      <span className="font-mono">152g</span>
                      <span>50ml Essig =</span>
                      <span className="font-mono">53g</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Küchen-Tipps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      Messbecher
                    </Badge>
                    <p>
                      Ein Messbecher für Milliliter ist oft genauer als eine
                      Küchenwaage für kleine Mengen.
                    </p>
                  </div>

                  <div>
                    <Badge variant="secondary" className="mb-2">
                      Rezepte
                    </Badge>
                    <p>
                      Amerikanische Rezepte verwenden oft Cups - 1 Cup ≈ 240ml.
                    </p>
                  </div>

                  <div>
                    <Badge variant="secondary" className="mb-2">
                      Genauigkeit
                    </Badge>
                    <p>
                      Für präzise Ergebnisse beim Backen sollten Sie wiegen
                      statt messen.
                    </p>
                  </div>

                  <div>
                    <Badge variant="secondary" className="mb-2">
                      Temperatur
                    </Badge>
                    <p>
                      Kalte Flüssigkeiten sind dichter als warme - beachten Sie
                      dies bei heißen Zutaten.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Häufig gestellte Fragen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqData.map(faq => (
                  <Collapsible
                    key={faq.id}
                    open={faqOpen[faq.id]}
                    onOpenChange={() => toggleFaq(faq.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-4 h-auto text-left"
                      >
                        <span className="font-medium">{faq.question}</span>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <div></div>
      </div>
    </div>
  )
}
