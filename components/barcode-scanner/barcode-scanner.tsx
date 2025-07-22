// components/barcode-scanner/BarcodeScanner.tsx

"use client";

import type { JSX } from "react";

import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { Camera, Loader2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Typen direkt hier definieren, um Abhängigkeiten zu reduzieren
type ScanMode = "camera" | "upload";

interface BarcodeScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
    onError?: (errorMessage: string) => void;
}

export function BarcodeScanner({
    isOpen,
    onClose,
    onScan,
    onError,
}: BarcodeScannerProps): JSX.Element {
    const [scanMode, setScanMode] = useState<ScanMode>("camera");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false); // Für den grünen "Blitz"-Effekt
    const [lastScannedCode, setLastScannedCode] = useState(""); // Zeigt den letzten Scan an

    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const mobileElementId = "mobile-barcode-scanner-container";
    const desktopElementId = "desktop-barcode-scanner-container";

    const stopScanning = useCallback(async () => {
        const scanner = scannerRef.current;
        if (scanner) {
            try {
                if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
                    await scanner.stop();
                }
                await scanner.clear();
            }
            catch (error_) {
                console.warn("Error during scanner cleanup, ignoring:", error_);
            }
            finally {
                scannerRef.current = null;
            }
        }
    }, []);

    // --- KORRIGIERTER HANDLER, UM RE-RENDER-SCHLEIFE ZU VERHINDERN ---
    const handleScanSuccess = useCallback(
        (decodedText: string) => {
            // Verwenden der funktionalen Form von setState, um die Abhängigkeit von 'lastScannedCode' zu entfernen.
            // Dies verhindert, dass die Funktion bei jeder Statusänderung neu erstellt wird.
            setLastScannedCode((prevCode) => {
                if (decodedText !== prevCode) {
                    // Aktionen nur für NEUE Codes ausführen
                    setIsSuccess(true);
                    setTimeout(() => setIsSuccess(false), 500); // Blitz für 500ms
                    onScan(decodedText);
                }
                // Den Zustand immer auf den zuletzt gescannten Code aktualisieren
                return decodedText;
            });
        },
        [onScan], // Die Abhängigkeit von lastScannedCode wurde entfernt, um die Schleife zu durchbrechen.
    );

    const handleScanFailure = useCallback(() => {
    // Diese Funktion wird ständig aufgerufen, daher keine Logs hier
    }, []);

    const startScanning = useCallback(
        async (elementId: string) => {
            if (!document.querySelector<HTMLElement>(`#${elementId}`)) {
                console.warn(`Scanner container #${elementId} not found in DOM.`);
                return;
            }

            if (scannerRef.current) {
                await stopScanning();
            }

            setIsLoading(true);
            setError(null);
            setIsSuccess(false);
            setLastScannedCode("");

            const html5QrCode = new Html5Qrcode(elementId, { verbose: false });
            scannerRef.current = html5QrCode;

            try {
                const cameras = await Html5Qrcode.getCameras();
                if (!cameras || cameras.length === 0) {
                    throw new Error("No cameras found on this device.");
                }

                const rearCamera
          = cameras.find(c => /back|environment/i.test(c.label)) || cameras[0];

                const config = {
                    fps: 10,
                    qrbox: { width: 280, height: 180 }, // Box leicht vergrößert
                    aspectRatio: 1.777778,
                };

                await html5QrCode.start(
                    rearCamera.id,
                    config,
                    handleScanSuccess,
                    handleScanFailure,
                );
            }
            catch (error_) {
                const message
          = error_ instanceof Error ? error_.message : "Failed to start camera.";
                setError(message);
                if (onError)
                    onError(message);
                await stopScanning();
            }
            finally {
                setIsLoading(false);
            }
        },
        [handleScanSuccess, handleScanFailure, onError, stopScanning],
    );

    useEffect(() => {
        if (isOpen && scanMode === "camera") {
            const timer = setTimeout(() => {
                const elementId
          = window.innerWidth < 640 ? mobileElementId : desktopElementId;
                startScanning(elementId);
            }, 150);
            return () => clearTimeout(timer);
        }
        else if (!isOpen) {
            stopScanning();
        }
    }, [isOpen, scanMode, startScanning, stopScanning]);

    useEffect(() => {
        return () => {
            stopScanning();
        };
    }, [stopScanning]);

    const handleFileUpload = useCallback(
        async (file: File) => {
            setUploadError(null);
            if (!file.type.startsWith("image/")) {
                setUploadError("Bitte wähle eine Bilddatei aus.");
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setUploadError("Datei ist zu groß (max. 10MB).");
                return;
            }

            const body = document.body;
            if (!body) {
                setUploadError(
                    "Interner Fehler: document.body konnte nicht gefunden werden.",
                );
                return;
            }

            setIsProcessingFile(true);

            const tempElement = document.createElement("div");
            tempElement.id = `temp-scanner-${Date.now()}`;
            tempElement.style.display = "none";
            body.append(tempElement);

            const tempScanner = new Html5Qrcode(tempElement.id);

            try {
                const result = await tempScanner.scanFile(file, false);
                onScan(result);
                onClose(); // Bei Upload direkt schließen
            }
            catch {
                setUploadError("Kein Barcode im Bild gefunden.");
            }
            finally {
                await tempScanner.clear();
                tempElement.remove();
                setIsProcessingFile(false);
            }
        },
        [onScan, onClose],
    );

    const handleFileInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file)
                handleFileUpload(file);
        },
        [handleFileUpload],
    );

    const handleFileDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            if (file)
                handleFileUpload(file);
        },
        [handleFileUpload],
    );

    const handleDragOver = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
        },
        [],
    );

    const handleModeSwitch = useCallback(
        (mode: ScanMode) => {
            if (mode === scanMode)
                return;
            if (scanMode === "camera") {
                stopScanning();
            }
            setScanMode(mode);
            setError(null);
            setUploadError(null);
        },
        [scanMode, stopScanning],
    );
    if (!isOpen)
        return <></>;

    const modeToggle = (
        <div className="flex mt-3 bg-muted rounded-lg p-1">
            <Button
                variant={scanMode === "camera" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleModeSwitch("camera")}
                className="flex-1 h-8"
            >
                <Camera className="h-3 w-3 mr-1" />
                {" "}
                Kamera
            </Button>
            <Button
                variant={scanMode === "upload" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleModeSwitch("upload")}
                className="flex-1 h-8"
            >
                <Upload className="h-3 w-3 mr-1" />
                {" "}
                Hochladen
            </Button>
        </div>
    );

    const cameraView = (elementId: string) => (
        <div
            className={`w-full h-full relative flex items-center justify-center overflow-hidden transition-all duration-300 ${isSuccess ? "shadow-[inset_0_0_0_6px_#22c55e]" : "shadow-[inset_0_0_0_0px_#22c55e]"}`}
        >
            <div
                id={elementId}
                ref={containerRef}
                className="w-full h-full"
                style={{ lineHeight: 0 }}
            />
            {isLoading && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p>Kamera wird initialisiert...</p>
                </div>
            )}
            {error && (
                <div className="absolute inset-0 bg-background/95 flex flex-col items-center justify-center p-4">
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <Button onClick={() => startScanning(elementId)}>
                        Erneut versuchen
                    </Button>
                </div>
            )}
            {/* --- ANGEPASSTES LIVE-FEEDBACK --- */}
            {lastScannedCode && (
                <div
                    className={`absolute bottom-4 left-4 right-4 text-white text-center p-2 rounded-lg z-10 backdrop-blur-sm transition-colors duration-300 ${isSuccess ? "bg-green-600/90" : "bg-black/60"}`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <p className="text-xs font-semibold uppercase">Letzter Scan:</p>
                        <p className="font-mono break-all text-base">{lastScannedCode}</p>
                    </div>
                </div>
            )}
        </div>
    );

    const uploadView = (
        <div
            className="w-full h-full flex items-center justify-center bg-muted/20"
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
        >
            <div className="text-center p-8">
                {isProcessingFile
                    ? (
                            <>
                                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground" />
                                <p className="font-medium">Barcode wird gescannt...</p>
                            </>
                        )
                    : (
                            <>
                                <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="font-medium mb-2">Bild hochladen</h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Bild hierher ziehen oder klicken
                                </p>
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isProcessingFile}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {" "}
                                    Bild auswählen
                                </Button>
                                {uploadError && (
                                    <Alert variant="destructive" className="mt-4 text-left">
                                        <AlertDescription>{uploadError}</AlertDescription>
                                    </Alert>
                                )}
                            </>
                        )}
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
            />
        </div>
    );

    return (
        <>
            {/* Mobile */}
            <div className="fixed inset-0 z-50 bg-background sm:hidden">
                <div className="flex flex-col h-screen">
                    <div className="flex-shrink-0 p-4 border-b">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Barcode Scanner</h2>
                            <Button size="icon" variant="ghost" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        {modeToggle}
                    </div>
                    <div className="flex-1 relative bg-black">
                        {scanMode === "camera" ? cameraView(mobileElementId) : uploadView}
                    </div>
                </div>
            </div>

            {/* Desktop */}
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent
                    className="hidden sm:block w-auto max-w-none p-0"
                    style={{ width: "520px" }}
                >
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle>Barcode Scanner</DialogTitle>
                        <DialogDescription>
                            Scanne einen Barcode oder lade ein Bild hoch.
                        </DialogDescription>
                        {modeToggle}
                    </DialogHeader>
                    <div className="p-6 pt-4">
                        <div className="relative w-[470px] h-[264px] bg-black rounded-lg overflow-hidden mx-auto">
                            {scanMode === "camera"
                                ? cameraView(desktopElementId)
                                : uploadView}
                        </div>
                        <Button variant="outline" onClick={onClose} className="mt-4 w-full">
                            Abbrechen
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
