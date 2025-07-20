// components/barcode-scanner/CameraView.tsx

"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";

import type { CameraViewProps } from "@/lib/types/scanner-types";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useHtml5QrCode } from "@/hooks/use-html5-qr-code";

// Unique element IDs for the scanner container
const DESKTOP_ELEMENT_ID = "desktop-barcode-scanner-view";
const MOBILE_ELEMENT_ID = "mobile-barcode-scanner-view";

export function CameraView({ onScan, onClose, onError }: CameraViewProps) {
  const { isLoading, error, startScanning, stopScanning } = useHtml5QrCode({
    onScanSuccess: (decodedText: string) => {
      onScan(decodedText);
      onClose();
    },
    onError,
  });

  // Determine the correct element ID based on screen size
  const getElementId = () =>
    window.innerWidth < 640 ? MOBILE_ELEMENT_ID : DESKTOP_ELEMENT_ID;

  // Start scanning when the component is mounted
  useEffect(() => {
    const elementId = getElementId();
    const timer = setTimeout(() => startScanning(elementId), 100);
    return () => {
      clearTimeout(timer);
      stopScanning();
    };
  }, []); // Run only once on mount

  const handleRetry = () => {
    const elementId = getElementId();
    startScanning(elementId);
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* These divs are mounted conditionally by the parent, so both will exist in the DOM but only one is visible */}
      <div
        id={DESKTOP_ELEMENT_ID}
        className="w-full h-full"
        style={{ lineHeight: 0 }}
      />
      <div
        id={MOBILE_ELEMENT_ID}
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

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center p-4 text-center">
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleRetry}>Erneut versuchen</Button>
        </div>
      )}
    </div>
  );
}
