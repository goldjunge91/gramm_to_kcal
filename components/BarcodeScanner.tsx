/**
 * Barcode Scanner Component
 * Uses html5-qrcode for better iOS Safari compatibility
 *
 * Key improvements for iOS:
 * - Better camera access handling
 * - Built-in device enumeration
 * - iOS-specific optimizations
 */

"use client";

import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { Camera, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type JSX } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
}

export function BarcodeScanner({
  isOpen,
  onClose,
  onScan,
  onError,
}: BarcodeScannerProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

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
  const handleScanFailure = useCallback((error: string) => {
    // Don't log frequent scanning failures - this is normal
    // console.log("Scan attempt failed:", error);
  }, []);

  // Start scanning with optimal configuration
  const startScanning = useCallback(
    async (elementId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // Create new scanner instance
        const html5QrCode = new Html5Qrcode(elementId);
        setScanner(html5QrCode);
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
            camera.label.toLowerCase().includes("back") ||
            camera.label.toLowerCase().includes("environment")
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
      } catch (error_) {
        const errorMessage =
          error_ instanceof Error ? error_.message : "Failed to start camera";
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
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
      scannerRef.current = null;
      setScanner(null);
    }
  }, []);

  // Start scanning when modal opens
  useEffect(() => {
    if (isOpen) {
      // Delay to ensure DOM elements are rendered
      const timer = setTimeout(() => {
        const isMobile = window.innerWidth < 640; // sm breakpoint
        const elementId = isMobile ? mobileElementId : desktopElementId;
        startScanning(elementId);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen, startScanning]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopScanning();
      setIsLoading(true);
      setError(null);
    }
  }, [isOpen, stopScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  if (!isOpen) return <></>;

  return (
    <>
      {/* Mobile: Custom fullscreen modal */}
      <div className="fixed inset-0 z-50 bg-background sm:hidden">
        <div className="flex flex-col h-screen">
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Barcode Scanner</h2>
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
            <p className="text-sm text-muted-foreground mt-1">
              Richte die Kamera auf einen Barcode (EAN-13)
            </p>
          </div>

          {/* Camera Container */}
          <div className="flex-1 relative bg-black">
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
                  <p className="text-sm">Kamera wird initialisiert...</p>
                </div>
              </div>
            )}
          </div>

          {/* Error and Instructions */}
          {(error || (!isLoading && !error)) && (
            <div className="flex-shrink-0 p-4 space-y-4">
              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Instructions */}
              {!error && (
                <div className="text-xs text-muted-foreground text-center">
                  <p>• Halte den Barcode im Scanbereich</p>
                  <p>• Funktioniert am besten mit EAN-13 Barcodes</p>
                </div>
              )}

              {/* Mobile retry button */}
              {error && (
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
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Dialog modal */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="hidden sm:block w-[90vw] max-w-lg max-h-[90vh] p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Barcode Scanner
            </DialogTitle>
            <DialogDescription className="text-sm">
              Richte die Kamera auf einen Barcode (EAN-13) für automatische
              Produkterkennung
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Desktop Camera Container */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
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
                    <p className="text-sm">Kamera wird initialisiert...</p>
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
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Instructions */}
            {!error && (
              <div className="text-sm text-muted-foreground text-center space-y-1">
                <p>• Halte den Barcode im Scanbereich</p>
                <p>• Funktioniert am besten mit EAN-13 Barcodes</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Abbrechen
              </Button>
              {error && (
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
