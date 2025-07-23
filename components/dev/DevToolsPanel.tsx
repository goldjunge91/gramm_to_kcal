/**
 * Entwicklertools-Panel für Barcode Scanner Tests
 * Bietet manuelle Tests, Voreinstellungen, Diagnose und Leistungsüberwachung
 */

"use client";

import type { JSX } from "react";

import {
    Activity,
    BarChart3,
    Download,
    Play,
    RotateCcw,
    Settings,
    TestTube,
    Trash2,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import type { DevScannerStats, ScanDiagnostics } from "@/lib/types/dev-scanner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    TEST_BARCODES,
    validateBarcode,
} from "@/lib/api/enhanced-product-lookup";

interface DevToolsPanelProps {
    onBarcodeTest: (barcode: string) => void;
    diagnostics: ScanDiagnostics[];
    stats: DevScannerStats;
    onClearHistory: () => void;
    onExportData: () => void;
    className?: string;
}

export function DevToolsPanel({
    onBarcodeTest,
    diagnostics,
    stats,
    onClearHistory,
    onExportData,
    className = "",
}: DevToolsPanelProps): JSX.Element {
    const [manualBarcode, setManualBarcode] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    // Handle manual barcode input
    const handleManualTest = useCallback(() => {
        if (!manualBarcode.trim()) {
            toast.error("Bitte geben Sie einen Barcode ein");
            return;
        }

        const validation = validateBarcode(manualBarcode.trim());
        if (!validation.isValid) {
            toast.error(`Ungültiger Barcode: ${validation.errors.join(", ")}`);
            return;
        }

        onBarcodeTest(manualBarcode.trim());
        setManualBarcode("");
    }, [manualBarcode, onBarcodeTest]);

    // Handle preset barcode selection
    const handlePresetTest = useCallback(
        (barcode: string) => {
            onBarcodeTest(barcode);
            toast.info("Teste vordefinierten Barcode...");
        },
        [onBarcodeTest],
    );

    // Filter test barcodes by category
    const filteredTestBarcodes
        = selectedCategory === "all"
            ? TEST_BARCODES
            : TEST_BARCODES.filter(
                    test => test.category === selectedCategory,
                );

    // Get unique categories
    const categories = [
        "all",
        ...new Set(TEST_BARCODES.map(test => test.category)),
    ];

    // Format scan duration
    const formatDuration = (ms: number) => {
        return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
    };

    // Calculate success rate
    const successRate
        = stats.totalScans > 0
            ? Math.round((stats.successfulScans / stats.totalScans) * 100)
            : 0;

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Entwicklertools
                </CardTitle>
            </CardHeader>

            <CardContent>
                <Tabs defaultValue="testing" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="testing">Tests</TabsTrigger>
                        <TabsTrigger value="history">Verlauf</TabsTrigger>
                        <TabsTrigger value="stats">Statistiken</TabsTrigger>
                    </TabsList>

                    {/* Testing Tab */}
                    <TabsContent value="testing" className="space-y-4">
                        {/* Manual Barcode Input */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">
                                Manueller Barcode-Test
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Barcode eingeben (z.B. 4000417025005)"
                                    value={manualBarcode}
                                    onChange={e =>
                                        setManualBarcode(e.target.value)}
                                    onKeyDown={e =>
                                        e.key === "Enter" && handleManualTest()}
                                    className="font-mono"
                                />
                                <Button
                                    onClick={handleManualTest}
                                    disabled={!manualBarcode.trim()}
                                    size="sm"
                                >
                                    <Play className="h-4 w-4 mr-1" />
                                    Testen
                                </Button>
                            </div>

                            {/* Real-time validation */}
                            {manualBarcode && (
                                <div className="text-xs">
                                    {(() => {
                                        const validation
                                            = validateBarcode(manualBarcode);
                                        return (
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={
                                                        validation.isValid
                                                            ? "default"
                                                            : "destructive"
                                                    }
                                                    className="text-xs"
                                                >
                                                    {validation.format}
                                                </Badge>
                                                <span
                                                    className={
                                                        validation.isValid
                                                            ? "text-green-600"
                                                            : "text-red-600"
                                                    }
                                                >
                                                    {validation.isValid
                                                        ? "Gültig"
                                                        : validation.errors[0]}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Preset Test Barcodes */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">
                                    Vordefinierte Test-Barcodes
                                </Label>
                                <Select
                                    value={selectedCategory}
                                    onValueChange={setSelectedCategory}
                                >
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(category => (
                                            <SelectItem
                                                key={category}
                                                value={category}
                                            >
                                                {category === "all"
                                                    ? "Alle"
                                                    : category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <ScrollArea className="h-64">
                                <div className="space-y-2">
                                    {filteredTestBarcodes.map(test => (
                                        <Card
                                            key={test.barcode}
                                            className="p-3"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-sm truncate">
                                                            {test.name}
                                                        </span>
                                                        <Badge
                                                            variant={
                                                                test.expectedResult
                                                                === "success"
                                                                    ? "default"
                                                                    : test.expectedResult
                                                                        === "failure"
                                                                        ? "destructive"
                                                                        : "secondary"
                                                            }
                                                            className="text-xs"
                                                        >
                                                            {
                                                                test.expectedResult
                                                            }
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground font-mono mb-1">
                                                        {test.barcode}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {test.description}
                                                    </div>
                                                    {test.notes && (
                                                        <div className="text-xs text-muted-foreground mt-1 italic">
                                                            {test.notes}
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handlePresetTest(
                                                            test.barcode,
                                                        )}
                                                    className="ml-2"
                                                >
                                                    <TestTube className="h-3 w-3 mr-1" />
                                                    Testen
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">
                                Scan-Verlauf
                            </Label>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onExportData}
                                    disabled={diagnostics.length === 0}
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    Exportieren
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onClearHistory}
                                    disabled={diagnostics.length === 0}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Löschen
                                </Button>
                            </div>
                        </div>

                        <ScrollArea className="h-80">
                            <div className="space-y-2">
                                {diagnostics.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>Noch keine Scans</p>
                                    </div>
                                ) : (
                                    diagnostics
                                        .slice()
                                        .reverse()
                                        .map(scan => (
                                            <Card
                                                key={scan.scanId}
                                                className="p-3"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge
                                                                variant={
                                                                    scan.success
                                                                        ? "default"
                                                                        : "destructive"
                                                                }
                                                                className="text-xs"
                                                            >
                                                                {scan.success
                                                                    ? "Erfolgreich"
                                                                    : "Fehlgeschlagen"}
                                                            </Badge>
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                {scan.scanMode}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(
                                                                    scan.timestamp,
                                                                ).toLocaleTimeString()}
                                                            </span>
                                                        </div>

                                                        <div className="text-sm font-mono mb-1">
                                                            {scan.barcode
                                                                || "No barcode"}
                                                        </div>

                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                            <span>
                                                                Scan:
                                                                {" "}
                                                                {formatDuration(
                                                                    scan.scanDuration,
                                                                )}
                                                            </span>
                                                            <span>
                                                                Suche:
                                                                {" "}
                                                                {formatDuration(
                                                                    scan.lookupDuration,
                                                                )}
                                                            </span>
                                                            {scan.deviceInfo && (
                                                                <span>
                                                                    {scan
                                                                        .deviceInfo
                                                                        .isMobile
                                                                        ? "Mobil"
                                                                        : "Desktop"}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {scan.error && (
                                                            <div className="text-xs text-red-600 mt-1">
                                                                Fehler:
                                                                {" "}
                                                                {scan.error}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            scan.barcode
                                                            && onBarcodeTest(
                                                                scan.barcode,
                                                            )}
                                                        disabled={!scan.barcode}
                                                        className="ml-2"
                                                    >
                                                        <RotateCcw className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </Card>
                                        ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    {/* Stats Tab */}
                    <TabsContent value="stats" className="space-y-4">
                        {/* Overview Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold">
                                        {stats.totalScans}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Scans gesamt
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {successRate}
                                        %
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Erfolgsrate
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold">
                                        {stats.averageResponseTime
                                            ? formatDuration(
                                                    stats.averageResponseTime,
                                                )
                                            : "N/A"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Ø Antwortzeit
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold">
                                        {stats.averageScanTime
                                            ? formatDuration(
                                                    stats.averageScanTime,
                                                )
                                            : "N/A"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Ø Scan-Zeit
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Top Brands */}
                        {stats.topBrands.length > 0 && (
                            <div>
                                <Label className="text-sm font-medium mb-2 block">
                                    Top Marken
                                </Label>
                                <div className="space-y-1">
                                    {stats.topBrands
                                        .slice(0, 5)
                                        .map(brand => (
                                            <div
                                                key={brand.brand}
                                                className="flex justify-between text-sm"
                                            >
                                                <span className="truncate">
                                                    {brand.brand}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {brand.count}
                                                </Badge>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Top Categories */}
                        {stats.topCategories.length > 0 && (
                            <div>
                                <Label className="text-sm font-medium mb-2 block">
                                    Top Kategorien
                                </Label>
                                <div className="space-y-1">
                                    {stats.topCategories
                                        .slice(0, 5)
                                        .map(category => (
                                            <div
                                                key={category.category}
                                                className="flex justify-between text-sm"
                                            >
                                                <span className="truncate">
                                                    {category.category}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {category.count}
                                                </Badge>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Performance Breakdown */}
                        <div>
                            <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Leistungsaufschlüsselung
                            </Label>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Erfolgreiche Scans:</span>
                                    <span className="text-green-600">
                                        {stats.successfulScans}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Fehlgeschlagene Scans:</span>
                                    <span className="text-red-600">
                                        {stats.failedScans}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Ø Antwortzeit:</span>
                                    <span className="font-mono">
                                        {stats.averageResponseTime
                                            ? formatDuration(
                                                    stats.averageResponseTime,
                                                )
                                            : "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Ø Scan-Zeit:</span>
                                    <span className="font-mono">
                                        {stats.averageScanTime
                                            ? formatDuration(
                                                    stats.averageScanTime,
                                                )
                                            : "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
