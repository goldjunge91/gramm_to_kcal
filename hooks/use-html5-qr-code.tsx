// hooks/use-html5-qr-code.tsx

import type { QrcodeSuccessCallback } from 'html5-qrcode'

import {
  Html5Qrcode,
  Html5QrcodeScannerState,

} from 'html5-qrcode'
import { useCallback, useEffect, useRef, useState } from 'react'

// Props for the custom hook
interface UseHtml5QrCodeProps {
  onScanSuccess: QrcodeSuccessCallback
  onScanFailure?: (error: any) => void
  onError?: (errorMessage: string) => void
}

// iOS-optimized configuration for the scanner
const SCANNER_CONFIG = {
  fps: 10,
  qrbox: { width: 250, height: 150 },
  aspectRatio: 1.777778, // 16:9
  disableFlip: false,
  videoConstraints: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    aspectRatio: { ideal: 16 / 9 },
    frameRate: { ideal: 15, max: 30 },
    facingMode: { ideal: 'environment' },
  },
}

/**
 * A custom hook to manage the Html5Qrcode scanner lifecycle.
 * It handles initialization, starting, and stopping the scanner.
 * @param {UseHtml5QrCodeProps} props - Callbacks for scan events.
 * @returns An object with scanner state and control functions.
 */
export function useHtml5QrCode({
  onScanSuccess,
  onScanFailure,
  onError,
}: UseHtml5QrCodeProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isStoppingRef = useRef(false) // Ref to prevent race conditions on stop

  const handleScanFailure = useCallback(
    (err: any) => {
      if (onScanFailure) {
        onScanFailure(err)
      }
    },
    [onScanFailure],
  )

  // --- ERNEUT KORRIGIERTE stopScanning FUNKTION ---
  // Ensures stop() fully completes before clear() is called.
  const stopScanning = useCallback(async () => {
    if (isStoppingRef.current || !scannerRef.current) {
      return
    }
    isStoppingRef.current = true

    try {
      const scanner = scannerRef.current
      if (scanner) {
        const state = scanner.getState()
        // Check if the scanner is active before trying to stop it.
        if (state === Html5QrcodeScannerState.SCANNING) {
          // Await the stop() promise to ensure it finishes before proceeding.
          await scanner.stop()
        }
        // Now that the scanner is stopped, clear the resources.
        // This addresses the "Cannot clear while scan is ongoing" error.
        await scanner.clear()
      }
    }
    catch (error_) {
      // This single catch block handles errors from both stop() and clear().
      console.error('Error during scanner cleanup:', error_)
    }
    finally {
      // Reset state at the very end.
      scannerRef.current = null
      isStoppingRef.current = false
    }
  }, [])

  const startScanning = useCallback(
    async (elementId: string) => {
      setIsLoading(true)
      setError(null)

      // Ensure any previous instance is stopped before starting a new one
      if (scannerRef.current) {
        await stopScanning()
      }

      const html5QrCode = new Html5Qrcode(elementId, {
        verbose: false, // Set to true for more detailed logs from the library
      })
      scannerRef.current = html5QrCode

      try {
        const cameras = await Html5Qrcode.getCameras()
        if (!cameras || cameras.length === 0) {
          throw new Error('No cameras found on this device.')
        }

        const rearCamera = cameras.find(camera =>
          /back|environment/i.test(camera.label),
        )
        const selectedCameraId = rearCamera ? rearCamera.id : cameras[0].id

        await html5QrCode.start(
          selectedCameraId,
          SCANNER_CONFIG,
          onScanSuccess,
          handleScanFailure,
        )

        setIsLoading(false)
      }
      catch (error_) {
        const errorMessage
          = error_ instanceof Error ? error_.message : 'Failed to start camera.'
        console.error('Scanner initialization failed:', error_)
        setError(errorMessage)
        setIsLoading(false)
        if (onError) {
          onError(errorMessage)
        }
        // Ensure cleanup is run on failure
        await stopScanning()
      }
    },
    [onScanSuccess, handleScanFailure, onError, stopScanning],
  )

  // Cleanup effect to ensure the scanner is stopped on unmount
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [stopScanning])

  return { isLoading, error, startScanning, stopScanning }
}
