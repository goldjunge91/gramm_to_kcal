/**
 * Barcode Scanner Component
 * Uses html5-qrcode for better iOS Safari compatibility
 */

"use client";

import type { JSX } from "react";

import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { Camera, Loader2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { BarcodeScannerProps, ScanMode } from "@/lib/types/scanner-types";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export function BarcodeScanner({
    isOpen,
    onClose,
    onScan,
    onError,
}: BarcodeScannerProps): JSX.Element {
    const [scanMode, setScanMode] = useState<ScanMode>("camera");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Scanner state managed via scannerRef for better cleanup control
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Unique element IDs for mobile and desktop
    const mobileElementId = "mobile-barcode-scanner";
    const desktopElementId = "desktop-barcode-scanner";

    // Handle successful barcode detection
    const handleScanSuccess = useCallback(
        (decodedText: string, decodedResult: any) => {
            console.log("Barcode detected:", decodedText, decodedResult);
            onScan(decodedText);
            onClose();
        },
        [onScan, onClose],
    );

    // Handle scanning errors (non-critical, happens frequently)
    const handleScanFailure = useCallback(() => {
        // Don't log frequent scanning failures - this is normal
        // These failures happen constantly during scanning and are expected
    }, []);

    // Handle file upload and scanning
    const handleFileUpload = useCallback(
        async (file: File) => {
            // Reset previous errors
            setUploadError(null);

            // Validate file type
            if (!file.type.startsWith("image/")) {
                setUploadError(
                    "Bitte wähle eine Bilddatei aus (PNG, JPG, etc.)",
                );
                return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setUploadError("Datei ist zu groß. Maximal 10MB erlaubt.");
                return;
            }

            setIsProcessingFile(true);

            try {
                // Create a temporary scanner instance for file scanning
                const tempElementId = `temp-scanner-${Date.now()}`;
                const tempElement = document.createElement("div");
                tempElement.id = tempElementId;
                tempElement.style.display = "none";
                document.body.append(tempElement);

                const tempScanner = new Html5Qrcode(tempElementId);

                try {
                    // Scan the uploaded file
                    const result = await tempScanner.scanFile(file, false);

                    console.log("File scan result:", result);

                    // Success - call the callback and close modal
                    onScan(result);
                    onClose();
                }
                catch (scanError) {
                    // Prüfe auf den spezifischen Fehlertext und zeige eine freundliche Meldung
                    const friendlyMessage
                        = scanError instanceof Error
                            && scanError.message.includes(
                                "No MultiFormat Readers were able to detect the code",
                            )
                            ? "Kein Barcode im Bild gefunden. Bitte versuche es mit einem anderen, klareren Bild."
                            : "Kein Barcode im Bild gefunden. Versuche es mit einem anderen Bild.";
                    setUploadError(friendlyMessage);
                    console.error("File scan failed:", scanError);
                    console.error("File scan failed:", scanError);
                    setUploadError(
                        "Kein Barcode im Bild gefunden. Versuche es mit einem anderen Bild.",
                    );
                }
                finally {
                    // Cleanup temp scanner
                    await tempScanner.clear();
                    tempElement.remove();
                }
            }
            catch (error) {
                console.error("File processing error:", error);
                setUploadError(
                    "Fehler beim Verarbeiten der Datei. Versuche es erneut.",
                );
            }
            finally {
                setIsProcessingFile(false);
            }
        },
        [onScan, onClose],
    );

    // Handle file input change
    const handleFileInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
                handleFileUpload(file);
            }
        },
        [handleFileUpload],
    );

    // Handle drag and drop
    const handleFileDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            if (file) {
                handleFileUpload(file);
            }
        },
        [handleFileUpload],
    );

    const handleDragOver = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
        },
        [],
    );

    // Note: handleModeSwitch moved after stopScanning definition

    // Start scanning with optimal configuration
    const startScanning = useCallback(
        async (elementId: string) => {
            try {
                setIsLoading(true);
                setError(null);

                // Create new scanner instance
                const html5QrCode = new Html5Qrcode(elementId);
                scannerRef.current = html5QrCode;

                // Get available cameras
                const cameras = await Html5Qrcode.getCameras();

                if (cameras.length === 0) {
                    throw new Error("No cameras found on this device");
                }

                // Choose the best camera (prefer back camera)
                let selectedCamera = cameras[0];

                // Look for back camera on mobile devices
                for (const camera of cameras) {
                    if (
                        camera.label.toLowerCase().includes("back")
                        || camera.label.toLowerCase().includes("environment")
                    ) {
                        selectedCamera = camera;
                        break;
                    }
                }

                console.log("Selected camera:", selectedCamera.label);

                // iOS-optimized configuration
                const config = {
                    fps: 10, // Lower FPS for better iOS performance
                    qrbox: { width: 250, height: 150 }, // EAN-13 optimized box
                    aspectRatio: 1.777778, // 16:9 ratio
                    disableFlip: false,
                    videoConstraints: {
                        width: { ideal: 1280, min: 640, max: 1920 },
                        height: { ideal: 720, min: 480, max: 1080 },
                        aspectRatio: { ideal: 16 / 9 },
                        frameRate: { ideal: 15, min: 10, max: 30 },
                        facingMode: { ideal: "environment" },
                    },
                };

                // Start scanning
                await html5QrCode.start(
                    selectedCamera.id,
                    config,
                    handleScanSuccess,
                    handleScanFailure,
                );

                setIsLoading(false);

                console.log("Scanner started successfully");
            }
            catch (error_) {
                const errorMessage
                    = error_ instanceof Error
                        ? error_.message
                        : "Failed to start camera";
                console.error("Scanner initialization failed:", error_);
                setError(errorMessage);
                setIsLoading(false);
                onError?.(errorMessage);
            }
        },
        [handleScanSuccess, handleScanFailure, onError],
    );

    // Stop scanning and cleanup
    const stopScanning = useCallback(async () => {
        if (scannerRef.current) {
            try {
                const scannerState = scannerRef.current.getState();
                if (scannerState === Html5QrcodeScannerState.SCANNING) {
                    await scannerRef.current.stop();
                }
                await scannerRef.current.clear();
            }
            catch (error) {
                console.error("Error stopping scanner:", error);
            }
            scannerRef.current = null;
        }
    }, []);

    // Switch between scan modes
    const handleModeSwitch = useCallback(
        (mode: ScanMode) => {
            if (mode === scanMode)
                return;

            // Stop camera scanning when switching away from camera mode
            if (scanMode === "camera") {
                stopScanning();
            }

            setScanMode(mode);
            setError(null);
            setUploadError(null);
            setIsLoading(mode === "camera");
        },
        [scanMode, stopScanning],
    );

    // Start scanning when modal opens and in camera mode
    useEffect(() => {
        if (isOpen && scanMode === "camera") {
            // Delay to ensure DOM elements are rendered
            const timer = setTimeout(() => {
                const isMobile = window.innerWidth < 640; // sm breakpoint
                const elementId = isMobile ? mobileElementId : desktopElementId;
                startScanning(elementId);
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [isOpen, scanMode, startScanning]);

    // Cleanup when modal closes
    useEffect(() => {
        if (!isOpen) {
            stopScanning();
            setScanMode("camera"); // Reset to camera mode
            setIsLoading(true);
            setError(null);
            setUploadError(null);
            setIsProcessingFile(false);
        }
    }, [isOpen, stopScanning]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopScanning();
        };
    }, [stopScanning]);

    if (!isOpen)
        return <></>;

    return (
        <>
            {/* Mobile: Custom fullscreen modal */}
            <div className="fixed inset-0 z-50 bg-background sm:hidden">
                <div className="flex flex-col h-screen">
                    {/* Header */}
                    <div className="flex-shrink-0 p-4 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {scanMode === "camera" ? (
                                    <Camera className="h-5 w-5" />
                                ) : (
                                    <Upload className="h-5 w-5" />
                                )}
                                <h2 className="text-lg font-semibold">
                                    Barcode Scanner
                                </h2>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onClose}
                                className="h-10 w-10 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Mode Toggle */}
                        <div className="flex mt-3 mb-2 bg-muted rounded-lg p-1">
                            <Button
                                variant={
                                    scanMode === "camera" ? "default" : "ghost"
                                }
                                size="sm"
                                onClick={() => handleModeSwitch("camera")}
                                className="flex-1 h-8"
                            >
                                <Camera className="h-3 w-3 mr-1" />
                                Kamera
                            </Button>
                            <Button
                                variant={
                                    scanMode === "upload" ? "default" : "ghost"
                                }
                                size="sm"
                                onClick={() => handleModeSwitch("upload")}
                                className="flex-1 h-8"
                            >
                                <Upload className="h-3 w-3 mr-1" />
                                Bild hochladen
                            </Button>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            {scanMode === "camera"
                                ? "Richte die Kamera auf einen Barcode (EAN-13)"
                                : "Lade ein Bild mit einem Barcode hoch"}
                        </p>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 relative bg-black">
                        {scanMode === "camera" ? (
                            <>
                                {/* Scanner Element */}
                                <div
                                    id={mobileElementId}
                                    className="w-full h-full"
                                    style={{ lineHeight: 0 }} // Prevent text spacing issues
                                />

                                {/* Loading Overlay */}
                                {isLoading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <div className="text-white text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                            <p className="text-sm">
                                                Kamera wird initialisiert...
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Upload Area */}
                                <div
                                    className="w-full h-full flex items-center justify-center bg-muted/20"
                                    onDrop={handleFileDrop}
                                    onDragOver={handleDragOver}
                                >
                                    <div className="text-center p-8">
                                        {isProcessingFile ? (
                                            <div className="text-center">
                                                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground" />
                                                <p className="text-lg font-medium text-muted-foreground">
                                                    Barcode wird gescannt...
                                                </p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Bitte warten
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                                <h3 className="text-lg font-medium text-foreground mb-2">
                                                    Barcode-Bild hochladen
                                                </h3>
                                                <p className="text-sm text-muted-foreground mb-6">
                                                    Ziehe ein Bild hierher oder
                                                    klicke zum Auswählen
                                                </p>
                                                <Button
                                                    onClick={() =>
                                                        fileInputRef.current?.click()}
                                                    className="mb-4"
                                                    disabled={isProcessingFile}
                                                >
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    Bild auswählen
                                                </Button>
                                                <p className="text-xs text-muted-foreground">
                                                    Unterstützt: PNG, JPG, GIF •
                                                    Max: 10MB
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Hidden File Input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileInputChange}
                                    className="hidden"
                                />
                            </>
                        )}
                    </div>

                    {/* Error and Instructions */}
                    {((scanMode === "camera"
                        && (error || (!isLoading && !error)))
                    || (scanMode === "upload" && uploadError)) && (
                        <div className="flex-shrink-0 p-4 space-y-4">
                            {/* Error Display */}
                            {(error || uploadError) && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        {error || uploadError}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Instructions */}
                            {!error
                                && !uploadError
                                && scanMode === "camera" && (
                                <div className="text-xs text-muted-foreground text-center">
                                    <p>
                                        • Halte den Barcode im Scanbereich
                                    </p>
                                    <p>
                                        • Funktioniert am besten mit EAN-13
                                        Barcodes
                                    </p>
                                </div>
                            )}

                            {!error
                                && !uploadError
                                && scanMode === "upload" && (
                                <div className="text-xs text-muted-foreground text-center">
                                    <p>
                                        • EAN-13 Barcodes funktionieren am
                                        besten
                                    </p>
                                    <p>
                                        • Gute Beleuchtung und scharfe
                                        Bilder helfen
                                    </p>
                                </div>
                            )}

                            {/* Retry buttons */}
                            {error && scanMode === "camera" && (
                                <Button
                                    onClick={() => {
                                        setError(null);
                                        startScanning(mobileElementId);
                                    }}
                                    className="w-full"
                                >
                                    Erneut versuchen
                                </Button>
                            )}

                            {uploadError && scanMode === "upload" && (
                                <Button
                                    onClick={() => {
                                        setUploadError(null);
                                        fileInputRef.current?.click();
                                    }}
                                    className="w-full"
                                >
                                    Anderes Bild wählen
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Desktop: Dialog modal */}
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="hidden sm:block w-[90vw] max-w-lg max-h-[90vh] p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="flex items-center gap-2">
                            {scanMode === "camera" ? (
                                <Camera className="h-5 w-5" />
                            ) : (
                                <Upload className="h-5 w-5" />
                            )}
                            Barcode Scanner
                        </DialogTitle>
                        <DialogDescription className="text-sm">
                            {scanMode === "camera"
                                ? "Richte die Kamera auf einen Barcode (EAN-13) für automatische Produkterkennung"
                                : "Lade ein Bild mit einem Barcode für automatische Produkterkennung hoch"}
                        </DialogDescription>

                        {/* Mode Toggle */}
                        <div className="flex mt-4 bg-muted rounded-lg p-1">
                            <Button
                                variant={
                                    scanMode === "camera" ? "default" : "ghost"
                                }
                                size="sm"
                                onClick={() => handleModeSwitch("camera")}
                                className="flex-1 h-8"
                            >
                                <Camera className="h-3 w-3 mr-1" />
                                Kamera
                            </Button>
                            <Button
                                variant={
                                    scanMode === "upload" ? "default" : "ghost"
                                }
                                size="sm"
                                onClick={() => handleModeSwitch("upload")}
                                className="flex-1 h-8"
                            >
                                <Upload className="h-3 w-3 mr-1" />
                                Bild hochladen
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Desktop Content Container */}
                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                            {scanMode === "camera" ? (
                                <>
                                    {/* Scanner Element */}
                                    <div
                                        id={desktopElementId}
                                        className="w-full h-full"
                                        style={{ lineHeight: 0 }}
                                    />

                                    {/* Loading Overlay */}
                                    {isLoading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <div className="text-white text-center">
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                                <p className="text-sm">
                                                    Kamera wird initialisiert...
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Close Button Overlay */}
                                    <div className="absolute top-4 right-4">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={onClose}
                                            className="h-10 w-10 p-0"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Upload Area */}
                                    <div
                                        className="w-full h-full flex items-center justify-center bg-muted/20"
                                        onDrop={handleFileDrop}
                                        onDragOver={handleDragOver}
                                    >
                                        <div className="text-center p-6">
                                            {isProcessingFile ? (
                                                <div className="text-center">
                                                    <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3 text-muted-foreground" />
                                                    <p className="text-base font-medium text-muted-foreground">
                                                        Barcode wird gescannt...
                                                    </p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Bitte warten
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                                                    <h3 className="text-base font-medium text-foreground mb-2">
                                                        Barcode-Bild hochladen
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        Ziehe ein Bild hierher
                                                        oder klicke zum
                                                        Auswählen
                                                    </p>
                                                    <Button
                                                        onClick={() =>
                                                            fileInputRef.current?.click()}
                                                        size="sm"
                                                        disabled={
                                                            isProcessingFile
                                                        }
                                                    >
                                                        <Upload className="h-4 w-4 mr-2" />
                                                        Bild auswählen
                                                    </Button>
                                                    <p className="text-xs text-muted-foreground mt-3">
                                                        Unterstützt: PNG, JPG,
                                                        GIF • Max: 10MB
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Hidden File Input */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileInputChange}
                                        className="hidden"
                                    />
                                </>
                            )}
                        </div>

                        {/* Error Display */}
                        {(error || uploadError) && (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    {error || uploadError}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Instructions */}
                        {!error && !uploadError && (
                            <div className="text-sm text-muted-foreground text-center space-y-1">
                                {scanMode === "camera" ? (
                                    <>
                                        <p>
                                            • Halte den Barcode im Scanbereich
                                        </p>
                                        <p>
                                            • Funktioniert am besten mit EAN-13
                                            Barcodes
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p>
                                            • EAN-13 Barcodes funktionieren am
                                            besten
                                        </p>
                                        <p>
                                            • Gute Beleuchtung und scharfe
                                            Bilder helfen
                                        </p>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="flex-1"
                            >
                                Abbrechen
                            </Button>
                            {error && scanMode === "camera" && (
                                <Button
                                    onClick={() => {
                                        setError(null);
                                        startScanning(desktopElementId);
                                    }}
                                    className="flex-1"
                                >
                                    Erneut versuchen
                                </Button>
                            )}
                            {uploadError && scanMode === "upload" && (
                                <Button
                                    onClick={() => {
                                        setUploadError(null);
                                        fileInputRef.current?.click();
                                    }}
                                    className="flex-1"
                                >
                                    Anderes Bild wählen
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
