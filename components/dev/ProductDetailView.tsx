/**
 * Umfassende Produktdetailansicht für Entwicklertests
 * Zeigt vollständige OpenFoodFacts-Daten mit formatierten Ansichten an
 */

"use client";

import {
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Info,
  Package,
  Star,
} from "lucide-react";
import Image from "next/image";
import { useState, type JSX } from "react";
import { toast } from "sonner";

import type { EnhancedProductLookupResult } from "@/lib/types/dev-scanner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProductDetailViewProps {
  result: EnhancedProductLookupResult | null;
  className?: string;
}

export function ProductDetailView({
  result,
  className = "",
}: ProductDetailViewProps): JSX.Element {
  const [imageLoadError, setImageLoadError] = useState<Record<string, boolean>>(
    {},
  );

  // Copy JSON to clipboard
  const copyToClipboard = async (data: any, label: string) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Format nutritional value
  const formatNutrientValue = (value: number | undefined, unit = "g") => {
    return value !== undefined ? `${value.toFixed(1)}${unit}` : "N/A";
  };

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("de-DE");
  };

  if (!result) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Scannen Sie einen Barcode, um detaillierte Produktinformationen zu sehen</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result.success) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Suche fehlgeschlagen:</strong> {result.error}
            </AlertDescription>
          </Alert>

          {/* Show raw data even on failure if available */}
          {result.enhancedData?.openFoodFacts && (
            <div className="mt-4">
              <Label className="text-sm font-medium">Rohe API-Antwort:</Label>
              <ScrollArea className="h-40 mt-2">
                <pre className="text-xs bg-muted p-2 rounded">
                  {JSON.stringify(result.enhancedData.openFoodFacts, null, 2)}
                </pre>
              </ScrollArea>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(
                    result.enhancedData!.openFoodFacts,
                    "Raw data",
                  )
                }
                className="mt-2"
              >
                <Copy className="h-3 w-3 mr-1" />
                Rohdaten kopieren
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const { product, enhancedData, metadata, validation } = result;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {product?.name || "Unknown Product"}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{metadata.barcode}</Badge>
              <Badge variant={validation.isValid ? "default" : "destructive"}>
                {validation.format}
              </Badge>
              {enhancedData?.nutritionScore && (
                <Badge variant="secondary">
                  <Star className="h-3 w-3 mr-1" />
                  {enhancedData.nutritionScore}
                </Badge>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="text-right text-xs text-muted-foreground">
            <div>
              Response:{" "}
              {Math.round(metadata.responseTime - metadata.requestTime)}ms
            </div>
            {enhancedData?.completenessScore && (
              <div>Completeness: {enhancedData.completenessScore}%</div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="nutrition">Nährwerte</TabsTrigger>
            <TabsTrigger value="images">Bilder</TabsTrigger>
            <TabsTrigger value="raw">Rohdaten</TabsTrigger>
            <TabsTrigger value="diagnostics">Diagnose</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Grundinformationen</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span>Kalorien (100g):</span>
                    <span className="font-mono">
                      {product?.kcal || "N/A"} kcal
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Menge:</span>
                    <span className="font-mono">
                      {enhancedData?.openFoodFacts.product.quantity || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Marken:</span>
                    <span className="font-mono text-right">
                      {enhancedData?.openFoodFacts.product.brands || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Kategorien</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {enhancedData?.categories
                    .slice(0, 6)
                    .map((category, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    )) || (
                    <span className="text-sm text-muted-foreground">Keine</span>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium">Allergene</Label>
              <div className="flex flex-wrap gap-1 mt-2">
                {enhancedData?.allergens.length ? (
                  enhancedData.allergens.map((allergen, index) => (
                    <Badge
                      key={index}
                      variant="destructive"
                      className="text-xs"
                    >
                      {allergen}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Keine angegeben
                  </span>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Zutaten</Label>
              <ScrollArea className="h-20 mt-2">
                <p className="text-sm leading-relaxed">
                  {enhancedData?.ingredients.join(", ") || "Nicht verfügbar"}
                </p>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Energie</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Kalorien:</span>
                    <span className="font-mono">
                      {formatNutrientValue(
                        enhancedData?.openFoodFacts.product.nutriments?.[
                          "energy-kcal_100g"
                        ],
                        "kcal",
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Energie (kJ):</span>
                    <span className="font-mono">
                      {formatNutrientValue(
                        enhancedData?.openFoodFacts.product.nutriments?.[
                          "energy-kj_100g"
                        ],
                        "kJ",
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Makronährstoffe</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Fett:</span>
                    <span className="font-mono">
                      {formatNutrientValue(
                        enhancedData?.openFoodFacts.product.nutriments
                          ?.fat_100g,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Gesättigte Fettsäuren:</span>
                    <span className="font-mono">
                      {formatNutrientValue(
                        enhancedData?.openFoodFacts.product.nutriments?.[
                          "saturated-fat_100g"
                        ],
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Kohlenhydrate:</span>
                    <span className="font-mono">
                      {formatNutrientValue(
                        enhancedData?.openFoodFacts.product.nutriments
                          ?.carbohydrates_100g,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Zucker:</span>
                    <span className="font-mono">
                      {formatNutrientValue(
                        enhancedData?.openFoodFacts.product.nutriments
                          ?.sugars_100g,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Proteine:</span>
                    <span className="font-mono">
                      {formatNutrientValue(
                        enhancedData?.openFoodFacts.product.nutriments
                          ?.proteins_100g,
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Weitere Nährstoffe</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Salz:</span>
                    <span className="font-mono">
                      {formatNutrientValue(
                        enhancedData?.openFoodFacts.product.nutriments
                          ?.salt_100g,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Natrium:</span>
                    <span className="font-mono">
                      {formatNutrientValue(
                        enhancedData?.openFoodFacts.product.nutriments
                          ?.sodium_100g,
                      )}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Ballaststoffe:</span>
                    <span className="font-mono">
                      {formatNutrientValue(
                        enhancedData?.openFoodFacts.product.nutriments
                          ?.fiber_100g,
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Front Image */}
              {enhancedData?.images.front && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Produktbild
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!imageLoadError.front ? (
                      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                        <Image
                          src={enhancedData.images.front}
                          alt="Product front"
                          fill
                          className="object-contain"
                          onError={() =>
                            setImageLoadError((prev) => ({
                              ...prev,
                              front: true,
                            }))
                          }
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">
                          Bild konnte nicht geladen werden
                        </span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() =>
                        window.open(enhancedData.images.front, "_blank")
                      }
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      In Originalgröße anzeigen
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Nutrition Label */}
              {enhancedData?.images.nutrition && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Nährwerttabelle
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!imageLoadError.nutrition ? (
                      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                        <Image
                          src={enhancedData.images.nutrition}
                          alt="Nutrition label"
                          fill
                          className="object-contain"
                          onError={() =>
                            setImageLoadError((prev) => ({
                              ...prev,
                              nutrition: true,
                            }))
                          }
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">
                          Bild konnte nicht geladen werden
                        </span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() =>
                        window.open(enhancedData.images.nutrition, "_blank")
                      }
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      In Originalgröße anzeigen
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Ingredients Image */}
              {enhancedData?.images.ingredients && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Zutaten
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!imageLoadError.ingredients ? (
                      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                        <Image
                          src={enhancedData.images.ingredients}
                          alt="Ingredients"
                          fill
                          className="object-contain"
                          onError={() =>
                            setImageLoadError((prev) => ({
                              ...prev,
                              ingredients: true,
                            }))
                          }
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">
                          Bild konnte nicht geladen werden
                        </span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() =>
                        window.open(enhancedData.images.ingredients, "_blank")
                      }
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      In Originalgröße anzeigen
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {!enhancedData?.images.front &&
              !enhancedData?.images.nutrition &&
              !enhancedData?.images.ingredients && (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Keine Bilder für dieses Produkt verfügbar</p>
                </div>
              )}
          </TabsContent>

          {/* Raw Data Tab */}
          <TabsContent value="raw" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">
                Vollständige OpenFoodFacts-Antwort
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(enhancedData?.openFoodFacts, "Raw API data")
                }
              >
                <Copy className="h-3 w-3 mr-1" />
                JSON kopieren
              </Button>
            </div>

            <ScrollArea className="h-96 border rounded-md">
              <pre className="text-xs p-4 leading-relaxed">
                {JSON.stringify(enhancedData?.openFoodFacts, null, 2)}
              </pre>
            </ScrollArea>

            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">
                Erweiterte Verarbeitungsergebnisse
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(result, "Complete result")}
              >
                <Copy className="h-3 w-3 mr-1" />
                Alles kopieren
              </Button>
            </div>

            <ScrollArea className="h-48 border rounded-md">
              <pre className="text-xs p-4 leading-relaxed">
                {JSON.stringify(result, null, 2)}
              </pre>
            </ScrollArea>
          </TabsContent>

          {/* Diagnostics Tab */}
          <TabsContent value="diagnostics" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Barcode-Validierung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    {validation.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">
                      {validation.isValid ? "Gültig" : "Ungültig"}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <Badge variant="outline">{validation.format}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Länge:</span>
                      <span className="font-mono">{validation.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prüfsumme:</span>
                      <span
                        className={
                          validation.checksum
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {validation.checksum ? "Gültig" : "Ungültig"}
                      </span>
                    </div>
                  </div>
                  {validation.errors.length > 0 && (
                    <div className="mt-2">
                      <Label className="text-xs">Fehler:</Label>
                      <ul className="text-xs text-red-600 mt-1">
                        {validation.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">API-Leistung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Gesamtzeit:</span>
                      <span className="font-mono">
                        {Math.round(
                          metadata.responseTime - metadata.requestTime,
                        )}
                        ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>API-URL:</span>
                      <span className="font-mono text-right text-muted-foreground">
                        {metadata.apiUrl.split("/").pop()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>User-Agent:</span>
                      <span className="font-mono text-right text-muted-foreground truncate">
                        {metadata.userAgent.split("/")[0]}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => window.open(metadata.apiUrl, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    API-Antwort anzeigen
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Datenqualität</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold">
                      {enhancedData?.completenessScore || 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Vollständigkeit
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {enhancedData?.nutritionScore || "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Nährwert-Score
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {formatDate(
                        enhancedData?.openFoodFacts.product
                          .last_modified_datetime,
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Zuletzt aktualisiert
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
