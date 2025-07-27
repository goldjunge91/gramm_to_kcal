"use client";

import type { JSX } from "react";

import { ChevronDown, Scan } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { ProductFormProps } from "@/types/types";

// Den neuen, verbesserten Scanner importieren
import { BarcodeScanner } from "@/components/barcode-scanner";
import { BarcodeScanner as ClassicBarcodeScanner } from "@/components/BarcodeScanner";
import { RecentScansDropdown } from "@/components/dev/RecentScansDropdown";
// import { Alert, AlertDescription } from "@/components/ui/alert"; // nicht mehr benötigt
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRecentScans } from "@/hooks/use-recent-scans";
import { lookupProductByBarcode } from "@/lib/api/product-lookup";
import { createLogger } from "@/lib/utils/logger";

/** Form component for adding new products to compare */
export function ProductForm({
    onSubmit,
    isLoading = false,
    compact = false,
    enableBarcode = false,
    enableBarcode2 = false, // Zweiter Button wiederhergestellt
}: ProductFormProps): JSX.Element {
    const logger = createLogger();
    const [name, setName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [kcal, setKcal] = useState("");

    const { recentScans, addRecentScan, removeRecentScan, isAuthenticated }
        = useRecentScans();

    // Getrennte States für die Scanner, wie von Ihnen gewünscht
    const [showScanner, setShowScanner] = useState(false);
    const [showScanner2, setShowScanner2] = useState(false);
    // const [isLookingUp, setIsLookingUp] = useState(false); // nicht mehr benötigt
    // Barcode-Feld für Scan
    const [barcode, setBarcode] = useState("");
    // Status für UI-Feedback
    const [barcodeStatus, setBarcodeStatus] = useState<string | null>(null);

    // --- VEREINFACHTER HANDLER ---
    // Scan übernimmt nur Barcode ins Eingabefeld
    const handleBarcodeScan = (scanned: string): void => {
        setBarcode(scanned);
        setBarcodeStatus("Barcode übernommen");
    };

    const handleRecentScanSelect = (scan: (typeof recentScans)[0]): void => {
        setName(scan.productName);
        setQuantity(scan.quantity.toString());
        setKcal(scan.kcal.toString());
        toast.success(`Produkt aus letzten Scans geladen: ${scan.productName}`);
    };

    const handleSubmit = async (event: React.FormEvent): Promise<void> => {
        event.preventDefault();
        setBarcodeStatus("Produkt wird gesucht...");
        const quantityNum = Number.parseFloat(quantity);
        const kcalNum = Number.parseFloat(kcal);

        if (
            !name.trim()
            || !quantityNum
            || quantityNum <= 0
            || !kcalNum
            || kcalNum <= 0
        ) {
            return;
        }

        // API-Abfrage nur beim Absenden
        const productData = {
            name: name.trim(),
            quantity: quantityNum,
            kcal: kcalNum,
            barcode,
        };
        try {
            const result = await lookupProductByBarcode(barcode);
            if (result.success && result.product) {
                setName(result.product.name);
                setQuantity(result.product.quantity.toString());
                setKcal(result.product.kcal.toString());
                setBarcodeStatus(`Produkt gefunden: ${result.product.name}`);
                toast.success(`Produkt gefunden: ${result.product.name}`);
            }
            else {
                setBarcodeStatus(result.error || "Produkt nicht gefunden");
                toast.error(
                    result.error || "Produkt nicht in der Datenbank gefunden",
                );
            }
        }
        catch (error) {
            const errorMessage
                = error instanceof Error
                    ? error.message
                    : "Fehler beim Laden der Produktdaten";
            setBarcodeStatus(errorMessage);
            toast.error(errorMessage);
        }
        await onSubmit(productData);
        if (isAuthenticated) {
            addRecentScan(productData, barcode);
        }
        setName("");
        setQuantity("");
        setKcal("");
        setBarcode("");
    };

    const resetForm = (): void => {
        setName("");
        setQuantity("");
        setKcal("");
        setBarcode("");
        setBarcodeStatus(null);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>
                            {enableBarcode || enableBarcode2
                                ? "Produkt scannen oder hinzufügen"
                                : "Neues Produkt hinzufügen"}
                        </CardTitle>
                        <div className="flex gap-2">
                            {/* Live-Barcode-Feedback & Status */}
                            {barcode && (
                                <div className="px-3 py-1 bg-black/80 text-white rounded text-xs font-mono mr-2 flex items-center animate-pulse">
                                    <Scan className="h-4 w-4 mr-1" />
                                    <span>Barcode: </span>
                                    <span className="font-bold ml-1">
                                        {barcode}
                                    </span>
                                    {barcodeStatus && (
                                        <span className="ml-2 text-yellow-300">
                                            {barcodeStatus}
                                        </span>
                                    )}
                                </div>
                            )}
                            {/* Button für den alten Scanner (falls zum Test benötigt) */}
                            {enableBarcode && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowScanner(true)}
                                    disabled={isLoading}
                                    className="flex items-center gap-2"
                                >
                                    <Scan className="h-4 w-4" />
                                    Scannen
                                </Button>
                            )}
                            {/* Ihr wiederhergestellter zweiter Button */}
                            {enableBarcode2 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowScanner2(true)}
                                    disabled={isLoading}
                                    className="flex items-center gap-2"
                                >
                                    <Scan className="h-4 w-4" />
                                    Scannen 2 (Neu)
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* ...kein scanResult mehr, UI-Feedback nur über barcodeStatus ... */}

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
                                        onChange={e =>
                                            setName(e.target.value)}
                                        placeholder="z.B. Vollkornbrot"
                                        required
                                        disabled={isLoading}
                                        className={
                                            isAuthenticated
                                            && recentScans.length > 0
                                                ? "pr-10"
                                                : ""
                                        }
                                    />
                                    {isAuthenticated
                                        && recentScans.length > 0 && (
                                        <RecentScansDropdown
                                            recentScans={recentScans}
                                            onSelect={
                                                handleRecentScanSelect
                                            }
                                            onRemove={removeRecentScan}
                                            trigger={(
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                                                    disabled={isLoading}
                                                >
                                                    <ChevronDown className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        Letzte Scans
                                                        anzeigen
                                                    </span>
                                                </Button>
                                            )}
                                            placeholder="Suche in letzten Scans..."
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="barcode">Barcode</Label>
                                <Input
                                    id="barcode"
                                    type="text"
                                    value={barcode}
                                    onChange={e => setBarcode(e.target.value)}
                                    placeholder="Barcode wird hier eingefügt..."
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quantity">Menge (g)</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    value={quantity}
                                    onChange={e =>
                                        setQuantity(e.target.value)}
                                    placeholder="z.B. 100"
                                    min="0"
                                    step="0.1"
                                    required
                                    disabled={isLoading}
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
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="submit"
                                className="flex-1 sm:flex-none sm:w-auto"
                                aria-label="Produkt zur Vergleichstabelle hinzufügen"
                                disabled={isLoading}
                            >
                                {isLoading
                                    ? "Wird hinzugefügt..."
                                    : "Hinzufügen"}
                            </Button>
                            {(name || quantity || kcal || barcode) && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetForm}
                                    disabled={isLoading}
                                >
                                    Zurücksetzen
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Instanz 1 (klassischer Scanner, bleibt offen nach Scan) */}
            {enableBarcode && (
                <ClassicBarcodeScanner
                    isOpen={showScanner}
                    onClose={() => setShowScanner(false)}
                    onScan={handleBarcodeScan}
                    onError={(error: string) => {
                        logger.error("Classic barcode scanner error", {
                            error,
                            scannerType: "classic",
                            operation: "barcodeScan",
                        });
                        toast.error(`Scanner-Fehler: ${error}`);
                        // Fenster bleibt offen, nur bei Fehler manuell schließen
                    }}
                />
            )}

            {/* Instanz 2 (neuer Scanner, bleibt offen nach Scan) */}
            {enableBarcode2 && (
                <BarcodeScanner
                    isOpen={showScanner2}
                    onClose={() => setShowScanner2(false)}
                    onScan={handleBarcodeScan}
                    onError={(error) => {
                        logger.error("New barcode scanner error", {
                            error,
                            scannerType: "new",
                            operation: "barcodeScan",
                        });
                        toast.error(`Scanner2-Fehler: ${error}`);
                        // Fenster bleibt offen, nur bei Fehler manuell schließen
                    }}
                />
            )}
        </>
    );
}
