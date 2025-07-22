// components/barcode-scanner/UploadView.tsx

"use client";

import { Html5Qrcode } from "html5-qrcode";
import { Loader2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import type { UploadViewProps } from "@/lib/types/scanner-types";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function UploadView({ onScan, onClose }: UploadViewProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const processFile = useCallback(
        async (file: File) => {
            setError(null);

            if (!file.type.startsWith("image/")) {
                setError("Bitte wähle eine Bilddatei aus (PNG, JPG, etc.).");
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setError("Datei ist zu groß. Maximal 10MB erlaubt.");
                return;
            }

            setIsProcessing(true);
            const tempScanner = new Html5Qrcode("temp-scanner-element", false);
            try {
                const result = await tempScanner.scanFile(file, false);
                onScan(result);
                onClose();
            }
            catch (error_) {
                console.error("File scan failed:", error_);
                setError(
                    "Kein Barcode im Bild gefunden. Versuche es mit einem anderen Bild.",
                );
            }
            finally {
                await tempScanner.clear();
                setIsProcessing(false);
            }
        },
        [onScan, onClose],
    );

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file)
            processFile(file);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file)
            processFile(file);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    return (
        <div
            className="w-full h-full flex flex-col items-center justify-center bg-muted/20 p-4"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            {/* Hidden element for html5-qrcode file scanning */}
            <div id="temp-scanner-element" style={{ display: "none" }} />

            <div className="text-center">
                {isProcessing
                    ? (
                            <>
                                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground" />
                                <p className="text-lg font-medium text-muted-foreground">
                                    Barcode wird gescannt...
                                </p>
                            </>
                        )
                    : (
                            <>
                                <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-medium text-foreground mb-2">
                                    Barcode-Bild hochladen
                                </h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Ziehe ein Bild hierher oder klicke zum Auswählen
                                </p>
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isProcessing}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Bild auswählen
                                </Button>
                                <p className="text-xs text-muted-foreground mt-4">
                                    Unterstützt: PNG, JPG • Max: 10MB
                                </p>
                            </>
                        )}
            </div>

            {error && (
                <Alert variant="destructive" className="mt-6 w-full max-w-sm">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
}
