/**
 * Dynamic BarcodeScanner Component
 * Dynamically imports the heavy BarcodeScanner for better performance
 */

"use client";

import type { JSX } from "react";

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

import type { BarcodeScannerProps } from "@/lib/types/scanner-types";

// Loading component
function ScannerLoading(): JSX.Element {
    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Scanner wird geladen...</p>
            </div>
        </div>
    );
}

// Dynamic import with loading state
const DynamicBarcodeScanner = dynamic(
    () => import("./BarcodeScanner").then(mod => ({ default: mod.BarcodeScanner })),
    {
        loading: ScannerLoading,
        ssr: false, // Disable SSR for camera-dependent component
    },
);

/**
 * Dynamic wrapper for BarcodeScanner component
 * Only loads the heavy html5-qrcode library when needed
 */
export function BarcodeScanner(props: BarcodeScannerProps): JSX.Element {
    return <DynamicBarcodeScanner {...props} />;
}
