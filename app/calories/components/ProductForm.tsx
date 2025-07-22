"use client";

import { ChevronDown, Scale } from "lucide-react";
import { useState, type JSX } from "react";
import { toast } from "sonner";

import type { Product } from "@/lib/db/schema";

import { BarcodeScanner } from "@/components/barcode-scanner";
import { RecentScansDropdown } from "@/components/dev/RecentScansDropdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MlToGramConverter } from "@/components/unit-converter/MlToGramConverter";
import { useRecentScans } from "@/hooks/use-recent-scans";

interface ProductFormProps {
  onSubmit: (
    product: Omit<
      Product,
      | "id"
      | "userId"
      | "createdAt"
      | "updatedAt"
      | "syncStatus"
      | "version"
      | "isDeleted"
      | "lastSyncAt"
    >,
  ) => Promise<void>;
  isLoading?: boolean;
  compact?: boolean;
}

/** Form component for adding new products to compare */
export const ProductForm = ({
  onSubmit,
  isLoading = false,
  compact = false,
}: ProductFormProps): JSX.Element => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [kcal, setKcal] = useState("");
  const [converterOpen, setConverterOpen] = useState(false);

  // barcode scanner state
  const [showScanner2, setShowScanner2] = useState(false);
  // Recent scans for authenticated users
  const { recentScans, addRecentScan, removeRecentScan, isAuthenticated } =
    useRecentScans();

  // Handle recent scan selection
  const handleRecentScanSelect = (scan: (typeof recentScans)[0]): void => {
    setName(scan.productName);
    setQuantity(scan.quantity.toString());
    setKcal(scan.kcal.toString());

    toast.success(`Produkt aus letzten Scans geladen: ${scan.productName}`);
  };

  // Barcode-Scan Handler
  const handleBarcodeScan = (barcode: string): void => {
    setName(barcode);
    setShowScanner2(false);
    toast.success(`Barcode erkannt: ${barcode}`);
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    const quantityNum = Number.parseFloat(quantity);
    const kcalNum = Number.parseFloat(kcal);

    if (
      !name.trim() ||
      !quantityNum ||
      quantityNum <= 0 ||
      !kcalNum ||
      kcalNum <= 0
    ) {
      return;
    }

    const productData = {
      name: name.trim(),
      quantity: quantityNum,
      kcal: kcalNum,
    };

    await onSubmit(productData);

    // Add to recent scans for authenticated users
    if (isAuthenticated) {
      addRecentScan(productData);
    }

    // Reset form
    setName("");
    setQuantity("");
    setKcal("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neues Produkt hinzufügen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className={`grid gap-4 ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"}`}
          >
            <div
              className={`space-y-2 ${compact ? "" : "sm:col-span-2 md:col-span-1"}`}
            >
              <Label htmlFor="name">Produktname</Label>
              <div className="relative">
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Vollkornbrot"
                  required
                  disabled={isLoading}
                  className={
                    isAuthenticated && recentScans.length > 0 ? "pr-20" : "pr-10"
                  }
                />
                {isAuthenticated && recentScans.length > 0 && (
                  <RecentScansDropdown
                    recentScans={recentScans}
                    onSelect={handleRecentScanSelect}
                    onRemove={removeRecentScan}
                    trigger={
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-10 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                        disabled={isLoading}
                      >
                        <ChevronDown className="h-4 w-4" />
                        <span className="sr-only">Letzte Scans anzeigen</span>
                      </Button>
                    }
                    placeholder="Suche in letzten Scans..."
                  />
                )}
                {/* Kamera-Icon als Button für Barcode-Scanner */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                  disabled={isLoading}
                  title="Barcode scannen"
                  onClick={() => setShowScanner2(true)}
                >
                  <Scale className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Menge (g)</Label>
              <div className="relative">
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="z.B. 100"
                  min="0"
                  step="0.1"
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <Dialog open={converterOpen} onOpenChange={setConverterOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                      disabled={isLoading}
                      title="ML zu Gramm Umrechner"
                    >
                      <Scale className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>ML zu Gramm Umrechner</DialogTitle>
                      <DialogDescription>
                        Konvertieren Sie Milliliter in Gramm für verschiedene
                        Substanzen
                      </DialogDescription>
                    </DialogHeader>
                    <MlToGramConverter
                      compact={true}
                      onConversionChange={(result) => {
                        if (result.success && result.unit === "g") {
                          setQuantity(result.value.toString());
                          toast.success(
                            `${result.originalValue} ml = ${result.value} g`,
                          );
                          setConverterOpen(false);
                        }
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kcal">Kalorien (kcal)</Label>
              <Input
                id="kcal"
                type="number"
                value={kcal}
                onChange={(e) => setKcal(e.target.value)}
                placeholder="z.B. 250"
                min="0"
                step="0.1"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full sm:w-auto"
            aria-label="Produkt zur Vergleichstabelle hinzufügen"
            disabled={isLoading}
          >
            {isLoading ? "Wird hinzugefügt..." : "Hinzufügen"}
          </Button>
          {/* BarcodeScanner Dialog außerhalb des Input-Feldes */}
          <Dialog open={showScanner2} onOpenChange={setShowScanner2}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Barcode scannen</DialogTitle>
                <DialogDescription>
                  Scanne den Barcode deines Produkts.
                </DialogDescription>
              </DialogHeader>
              <BarcodeScanner
                isOpen={showScanner2}
                onClose={() => setShowScanner2(false)}
                onScan={handleBarcodeScan}
                onError={(error) => {
                  console.error("Scanner2 error:", error);
                  toast.error(`Scanner2-Fehler: ${error}`);
                  // Fenster bleibt offen, nur bei Fehler manuell schließen
                }}
              />
            </DialogContent>
          </Dialog>
        </form>
      </CardContent>
    </Card>
  );
};
