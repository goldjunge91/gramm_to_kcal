// components/barcode-scanner/types.ts

import type { QrcodeSuccessCallback } from "html5-qrcode";

// export interface BarcodeScannerProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onScan: (barcode: string) => void;
//   onError?: (error: string) => void;
// }

// export type ScanMode = "camera" | "upload";

/**
 * Defines the possible scanning modes.
 * 'camera': Use the device's camera to scan in real-time.
 * 'upload': Upload an image file to scan for a barcode.
 */
export type ScanMode = "camera" | "upload";

/**
 * Props for the main BarcodeScanner component.
 */
export interface BarcodeScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
    onError?: (errorMessage: string) => void;
}

/**
 * Props for the custom hook that manages the scanner instance.
 */
export interface UseHtml5QrCodeProps {
    onScanSuccess: QrcodeSuccessCallback;
    onScanFailure?: (error: unknown) => void;
    onError?: (errorMessage: string) => void;
}

/**
 * Props for the component responsible for camera scanning.
 */
export interface CameraViewProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
    onError?: (errorMessage: string) => void;
}

/**
 * Props for the component responsible for file upload scanning.
 */
export interface UploadViewProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}
