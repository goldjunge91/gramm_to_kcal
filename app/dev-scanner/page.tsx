/**
 * Developer Barcode Scanner Testing Page
 * Comprehensive testing interface with diagnostics, performance monitoring, and detailed product information
 */

"use client";

import type { JSX } from "react";

import { Activity, Camera, Code, Scan, Timer, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type {
    DevScannerStats,
    EnhancedProductLookupResult,
    ScanDiagnostics,
} from "@/types/dev-scanner";

import { DevBarcodeScanner } from "@/components/dev/DevBarcodeScanner";
import { DevToolsPanel } from "@/components/dev/DevToolsPanel";
import { ProductDetailView } from "@/components/dev/ProductDetailView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { enhancedLookupProductByBarcode } from "@/lib/api/enhanced-product-lookup";
import { createLogger } from "@/lib/utils/logger";

export default function DevScannerPage(): JSX.Element {
    const logger = createLogger();

    // Core state
    const [showScanner, setShowScanner] = useState(false);
    const [showSpeedTest, setShowSpeedTest] = useState(false);
    const [currentResult, setCurrentResult]
        = useState<EnhancedProductLookupResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [speedTestResult, setSpeedTestResult] = useState<{
        detectionTime: number;
        barcode: string;
        timestamp: string;
    } | null>(null);

    // Diagnostics and history
    const [diagnostics, setDiagnostics] = useState<ScanDiagnostics[]>([]);
    const [sessionStats, setSessionStats] = useState<DevScannerStats>({
        totalScans: 0,
        successfulScans: 0,
        failedScans: 0,
        averageResponseTime: 0,
        averageScanTime: 0,
        topBrands: [],
        topCategories: [],
        recentScans: [],
    });

    // Session ID for tracking
    const [sessionId] = useState(
        () =>
            `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    );

    // Load diagnostics from sessionStorage on mount
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem("dev-scanner-diagnostics");
            if (stored) {
                const parsedDiagnostics = JSON.parse(
                    stored,
                ) as ScanDiagnostics[];
                setDiagnostics(parsedDiagnostics);
                updateStatsFromDiagnostics(parsedDiagnostics);
            }
        }
        catch (error) {
            logger.warn("Failed to load scanner diagnostics from sessionStorage", {
                error: error instanceof Error ? error.message : String(error),
                operation: "loadDiagnostics",
            });
        }
    }, []);

    // Save diagnostics to sessionStorage whenever they change
    useEffect(() => {
        try {
            sessionStorage.setItem(
                "dev-scanner-diagnostics",
                JSON.stringify(diagnostics),
            );
        }
        catch (error) {
            logger.error("Failed to save scanner diagnostics to sessionStorage", {
                error: error instanceof Error ? error.message : String(error),
                operation: "saveDiagnostics",
            });
        }
    }, [diagnostics]);

    // Update statistics from diagnostics
    const updateStatsFromDiagnostics = useCallback(
        (allDiagnostics: ScanDiagnostics[]) => {
            const totalScans = allDiagnostics.length;
            const successfulScans = allDiagnostics.filter(
                d => d.success,
            ).length;
            const failedScans = totalScans - successfulScans;

            const responseTimes = allDiagnostics
                .map(d => d.lookupDuration)
                .filter(t => t > 0);
            const scanTimes = allDiagnostics
                .map(d => d.scanDuration)
                .filter(t => t > 0);

            const averageResponseTime
                = responseTimes.length > 0
                    ? responseTimes.reduce((a, b) => a + b, 0)
                    / responseTimes.length
                    : 0;

            const averageScanTime
                = scanTimes.length > 0
                    ? scanTimes.reduce((a, b) => a + b, 0) / scanTimes.length
                    : 0;

            // Extract brands and categories from successful scans
            // Note: This would require storing additional product data in diagnostics
            // For now, we'll keep empty arrays
            const topBrands: Array<{ brand: string; count: number }> = [];
            const topCategories: Array<{ category: string; count: number }>
                = [];

            setSessionStats({
                totalScans,
                successfulScans,
                failedScans,
                averageResponseTime,
                averageScanTime,
                topBrands,
                topCategories,
                recentScans: allDiagnostics.slice(-10), // Last 10 scans
            });
        },
        [],
    );

    // Handle barcode scan (from camera or upload)
    const handleBarcodeScan = useCallback(
        async (barcode: string, scanDiagnostics: ScanDiagnostics) => {
            setIsLoading(true);
            setShowScanner(false);

            const lookupStartTime = performance.now();

            try {
                const result = await enhancedLookupProductByBarcode(barcode);
                const lookupEndTime = performance.now();

                // Update scan diagnostics with lookup duration
                const updatedDiagnostics: ScanDiagnostics = {
                    ...scanDiagnostics,
                    lookupDuration: lookupEndTime - lookupStartTime,
                    success: result.success,
                    error: result.success ? undefined : result.error,
                };

                // Add to diagnostics history
                const newDiagnostics = [...diagnostics, updatedDiagnostics];
                setDiagnostics(newDiagnostics);
                updateStatsFromDiagnostics(newDiagnostics);

                // Set current result
                setCurrentResult(result);

                // Show toast notification
                if (result.success) {
                    toast.success(
                        `Product found: ${result.product?.name || "Unknown"}`,
                    );
                }
                else {
                    toast.error(`Lookup failed: ${result.error}`);
                }
            }
            catch (error) {
                const errorMessage
                    = error instanceof Error ? error.message : "Unknown error";

                // Update diagnostics with error
                const updatedDiagnostics: ScanDiagnostics = {
                    ...scanDiagnostics,
                    lookupDuration: performance.now() - lookupStartTime,
                    success: false,
                    error: errorMessage,
                };

                const newDiagnostics = [...diagnostics, updatedDiagnostics];
                setDiagnostics(newDiagnostics);
                updateStatsFromDiagnostics(newDiagnostics);

                toast.error(`Error: ${errorMessage}`);
            }
            finally {
                setIsLoading(false);
            }
        },
        [diagnostics, updateStatsFromDiagnostics],
    );

    // Handle barcode test from developer tools
    const handleBarcodeTest = useCallback(
        async (barcode: string) => {
            setIsLoading(true);

            // Create mock scan diagnostics for manual tests
            const mockScanDiagnostics: ScanDiagnostics = {
                scanId: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
                timestamp: new Date().toISOString(),
                scanMode: "upload", // Manual tests are treated as upload mode
                barcode,
                scanDuration: 0, // No scan duration for manual tests
                lookupDuration: 0, // Will be filled by handleBarcodeScan
                success: false, // Will be updated by handleBarcodeScan
                deviceInfo: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    isMobile:
                        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                            navigator.userAgent,
                        ),
                    hasCamera: false,
                    cameraCount: 0,
                },
            };

            await handleBarcodeScan(barcode, mockScanDiagnostics);
        },
        [handleBarcodeScan],
    );

    // Clear scan history
    const handleClearHistory = useCallback(() => {
        setDiagnostics([]);
        setSessionStats({
            totalScans: 0,
            successfulScans: 0,
            failedScans: 0,
            averageResponseTime: 0,
            averageScanTime: 0,
            topBrands: [],
            topCategories: [],
            recentScans: [],
        });
        setCurrentResult(null);
        toast.success("Scan history cleared");
    }, []);

    // Export scan data
    const handleExportData = useCallback(() => {
        const exportData = {
            sessionId,
            timestamp: new Date().toISOString(),
            stats: sessionStats,
            diagnostics,
            currentResult,
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dev-scanner-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.append(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        toast.success("Scan data exported");
    }, [sessionId, sessionStats, diagnostics, currentResult]);

    // Handle speed test scan - focus on detection time only
    const handleSpeedTestScan = useCallback(
        (barcode: string, scanDiagnostics: ScanDiagnostics) => {
            const detectionTime = scanDiagnostics.scanDuration;

            setSpeedTestResult({
                detectionTime,
                barcode,
                timestamp: new Date().toLocaleTimeString(),
            });

            // DON'T close the speed test scanner - keep it open for multiple tests
            // setShowSpeedTest(false);

            // Show immediate visual feedback
            toast.success(`Detected in ${Math.round(detectionTime)}ms`, {
                description: `Barcode: ${barcode}`,
                duration: 3000,
            });
        },
        [],
    );

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Code className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">
                                    Barcode Scanner Developer Testing
                                </h1>
                                <p className="text-muted-foreground">
                                    Advanced testing interface with performance
                                    diagnostics and detailed product analysis
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex items-center gap-6 text-sm">
                            <div className="text-center">
                                <div className="text-lg font-bold">
                                    {sessionStats.totalScans}
                                </div>
                                <div className="text-muted-foreground">
                                    Scans
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-green-600">
                                    {sessionStats.totalScans > 0
                                        ? Math.round(
                                                (sessionStats.successfulScans
                                                    / sessionStats.totalScans)
                                                * 100,
                                            )
                                        : 0}
                                    %
                                </div>
                                <div className="text-muted-foreground">
                                    Success
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold">
                                    {sessionStats.averageResponseTime > 0
                                        ? `${Math.round(sessionStats.averageResponseTime)}ms`
                                        : "N/A"}
                                </div>
                                <div className="text-muted-foreground">
                                    Avg Time
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Scanner Interface */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Camera className="h-5 w-5" />
                                    Scanner Interface
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button
                                    onClick={() => setShowScanner(true)}
                                    disabled={isLoading}
                                    className="w-full"
                                    size="lg"
                                >
                                    <Scan className="h-4 w-4 mr-2" />
                                    {isLoading
                                        ? "Processing..."
                                        : "Start Barcode Scanner"}
                                </Button>

                                <Button
                                    onClick={() => setShowSpeedTest(true)}
                                    disabled={isLoading}
                                    variant="outline"
                                    className="w-full"
                                    size="lg"
                                >
                                    <Zap className="h-4 w-4 mr-2" />
                                    Speed Detection Test
                                </Button>

                                {speedTestResult && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Timer className="h-4 w-4 text-green-600" />
                                            <span className="font-medium text-green-800">
                                                Last Detection
                                            </span>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <div className="flex justify-between">
                                                <span>Speed:</span>
                                                <span className="font-mono font-bold text-green-700">
                                                    {Math.round(
                                                        speedTestResult.detectionTime,
                                                    )}
                                                    ms
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Barcode:</span>
                                                <span className="font-mono text-xs">
                                                    {speedTestResult.barcode}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Time:</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {speedTestResult.timestamp}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="text-sm text-muted-foreground text-center">
                                    <p>
                                        • Camera and image upload modes
                                        available
                                    </p>
                                    <p>
                                        • Real-time diagnostics and performance
                                        monitoring
                                    </p>
                                    <p>
                                        • Enhanced error handling and device
                                        detection
                                    </p>
                                    <p>
                                        • Speed test: instant detection feedback
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Developer Tools Panel */}
                        <DevToolsPanel
                            onBarcodeTest={handleBarcodeTest}
                            diagnostics={diagnostics}
                            stats={sessionStats}
                            onClearHistory={handleClearHistory}
                            onExportData={handleExportData}
                        />
                    </div>

                    {/* Center Column: Product Detail View */}
                    <div className="lg:col-span-2">
                        <ProductDetailView
                            result={currentResult}
                            className="h-fit"
                        />
                    </div>
                </div>

                {/* Recent Activity Summary */}
                {diagnostics.length > 0 && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Session Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">
                                        {sessionStats.totalScans}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Total Scans
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {sessionStats.successfulScans}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Successful
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">
                                        {sessionStats.failedScans}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Failed
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">
                                        {sessionStats.averageResponseTime > 0
                                            ? `${Math.round(sessionStats.averageResponseTime)}ms`
                                            : "N/A"}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Avg Response
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Scanner Modal */}
            <DevBarcodeScanner
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                onScan={handleBarcodeScan}
                onError={(error) => {
                    toast.error(`Scanner error: ${error}`);
                    setShowScanner(false);
                }}
            />

            {/* Speed Test Scanner Modal */}
            <DevBarcodeScanner
                isOpen={showSpeedTest}
                onClose={() => setShowSpeedTest(false)}
                onScan={handleSpeedTestScan}
                onError={(error) => {
                    toast.error(`Speed test error: ${error}`);
                    setShowSpeedTest(false);
                }}
            />
        </div>
    );
}
