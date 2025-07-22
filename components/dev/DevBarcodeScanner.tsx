/**
 * Erweiterte Barcode Scanner für Entwicklertests
 * Enthält Diagnose, Leistungsmetriken und Geräteinformationen
 */

'use client'

import type { JSX } from 'react'

import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import {
  Activity,
  Camera,
  Clock,
  Loader2,
  Settings,
  Smartphone,
  Upload,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { ScanDiagnostics } from '@/lib/types/dev-scanner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'

interface DevBarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (barcode: string, diagnostics: ScanDiagnostics) => void
  onError?: (error: string) => void
}

type ScanMode = 'camera' | 'upload'

export function DevBarcodeScanner({
  isOpen,
  onClose,
  onScan,
  onError,
}: DevBarcodeScannerProps): JSX.Element {
  // Core scanner state
  const [scanMode, setScanMode] = useState<ScanMode>('camera')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Diagnostics state
  const scanStartTimeRef = useRef<number>(0)
  const [deviceInfo, setDeviceInfo] = useState<
    ScanDiagnostics['deviceInfo'] | null
  >(null)
  const [scannerSettings, setScannerSettings] = useState<
    ScanDiagnostics['scannerSettings'] | null
  >(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [fps, setFps] = useState(0)
  const [flashFeedback, setFlashFeedback] = useState<
    'success' | 'error' | null
  >(null)

  // Refs
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Scanner ID for HTML5-QRCode
  const scannerId = 'dev-barcode-scanner'
  const tempElementId = 'dev-temp-scanner'

  // Initialize device info
  useEffect(() => {
    if (isOpen) {
      setDeviceInfo({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        isMobile:
          /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
          ),
        hasCamera: false, // Will be updated when camera is accessed
        cameraCount: 0, // Will be updated when cameras are enumerated
      })
    }
  }, [isOpen])

  // Generate unique scan ID
  const generateScanId = (): string => {
    return `scan_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  }

  // Create diagnostics object
  const createDiagnostics = useCallback(
    (
      barcode: string,
      success: boolean,
      scanStart: number,
      currentDeviceInfo?: ScanDiagnostics['deviceInfo'],
      currentScannerSettings?: ScanDiagnostics['scannerSettings'],
      error?: string,
    ): ScanDiagnostics => {
      const endTime = performance.now()
      return {
        scanId: generateScanId(),
        timestamp: new Date().toISOString(),
        scanMode,
        barcode,
        scanDuration: endTime - scanStart,
        lookupDuration: 0, // Will be updated by parent component
        success,
        error,
        deviceInfo: currentDeviceInfo,
        scannerSettings: currentScannerSettings,
      }
    },
    [scanMode], // Only scanMode dependency
  )

  // Start camera scanning
  const startScanning = useCallback(async () => {
    if (scannerRef.current || scanMode !== 'camera')
      return

    setIsLoading(true)
    setError(null)
    scanStartTimeRef.current = performance.now()

    // Wait for DOM element to be available
    const waitForElement = (
      elementId: string,
      maxAttempts = 10,
    ): Promise<HTMLElement> => {
      return new Promise((resolve, reject) => {
        let attempts = 0

        const checkElement = () => {
          const element = document.querySelector<HTMLElement>(`#${elementId}`)
          if (element) {
            resolve(element)
          }
          else if (attempts < maxAttempts) {
            attempts++
            setTimeout(checkElement, 100) // Wait 100ms between attempts
          }
          else {
            reject(
              new Error(
                `Element with id '${elementId}' not found after ${maxAttempts} attempts`,
              ),
            )
          }
        }

        checkElement()
      })
    }

    try {
      // Wait for the scanner element to be available in the DOM
      await waitForElement(scannerId)

      // Create scanner instance
      const scanner = new Html5Qrcode(scannerId)
      scannerRef.current = scanner

      // Enumerate cameras for device info
      try {
        const cameras = await Html5Qrcode.getCameras()
        setDeviceInfo(prev =>
          prev
            ? {
                ...prev,
                hasCamera: cameras.length > 0,
                cameraCount: cameras.length,
              }
            : null,
        )
      }
      catch (enumError) {
        console.warn('Could not enumerate cameras:', enumError)
      }

      // Configure scanner with performance monitoring
      const config = {
        fps: 10,
        qrbox: { width: 280, height: 280 }, // Larger qrbox to fill most of the 320px container
        aspectRatio: 1,
      }

      setScannerSettings(config)

      // Monitor FPS
      const fpsInterval = setInterval(() => {
        setFps(config.fps)
        setScanProgress(prev => Math.min(prev + 10, 90))
      }, 1000)

      // Start scanning
      await scanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          // Success callback - flash green
          setFlashFeedback('success')
          setTimeout(() => setFlashFeedback(null), 1000) // Clear after 1 second

          clearInterval(fpsInterval)
          const diagnostics = createDiagnostics(
            decodedText,
            true,
            scanStartTimeRef.current,
            deviceInfo || undefined,
            config,
          )
          onScan(decodedText, diagnostics)
          // Don't stop scanning for speed tests - keep it running
          // stopScanning();
        },
        (errorMessage) => {
          // Error callback - don't spam console for scan attempts
          if (!errorMessage.includes('NotFoundException')) {
            console.debug('Scan attempt:', errorMessage)
          }
        },
      )

      setScanProgress(100)
      setIsLoading(false)

      // Cleanup FPS monitor after 30 seconds
      setTimeout(() => {
        clearInterval(fpsInterval)
      }, 30000)
    }
    catch (error) {
      console.error('Scanner start error:', error)
      const errorMessage
        = error instanceof Error
          ? error.message.includes('not found')
            ? 'Scanner initialization failed - dialog not ready. Please try again.'
            : error.message
          : 'Failed to start camera'
      setError(errorMessage)
      setIsLoading(false)
      onError?.(errorMessage)
    }
  }, [scanMode, onScan, onError])

  // Stop scanning
  const stopScanning = useCallback(async () => {
    if (!scannerRef.current)
      return

    try {
      const scanner = scannerRef.current

      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        await scanner.stop()
      }

      await scanner.clear()
      scannerRef.current = null
      setScanProgress(0)
      setFps(0)
    }
    catch (error) {
      console.error('Scanner stop error:', error)
    }
  }, [])

  // Handle mode switch
  const handleModeSwitch = useCallback(
    async (newMode: ScanMode) => {
      if (newMode === scanMode)
        return

      await stopScanning()
      setScanMode(newMode)
      setError(null)
      setUploadError(null)
      setScanProgress(0)
    },
    [scanMode, stopScanning],
  )

  // Handle file upload
  const handleFileUpload = useCallback(
    async (file: File) => {
      setIsProcessingFile(true)
      setUploadError(null)
      scanStartTimeRef.current = performance.now()

      try {
        // Create temporary scanner for file processing
        const tempElement = document.createElement('div')
        tempElement.id = tempElementId
        tempElement.style.display = 'none'
        document.body.append(tempElement)

        const tempScanner = new Html5Qrcode(tempElementId)

        const result = await tempScanner.scanFile(file, false)

        // Cleanup
        await tempScanner.clear()
        tempElement.remove()

        const diagnostics = createDiagnostics(
          result,
          true,
          scanStartTimeRef.current,
          deviceInfo || undefined,
          undefined, // No scanner settings for file upload
          undefined, // No error
        )
        onScan(result, diagnostics)
        onClose()
      }
      catch (error) {
        console.error('File scan error:', error)
        const errorMessage
          = error instanceof Error ? error.message : 'Failed to scan file'
        setUploadError(errorMessage)

        onError?.(errorMessage)

        // Cleanup temp element if it exists
        const tempElement = document.querySelector(`#${tempElementId}`)
        if (tempElement) {
          tempElement.remove()
        }
      }
      finally {
        setIsProcessingFile(false)
      }
    },
    [onScan, onClose, onError],
  )

  // File input change handler
  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        handleFileUpload(file)
      }
    },
    [handleFileUpload],
  )

  // Drag and drop handlers
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const files = Array.from(event.dataTransfer.files)
      const imageFile = files.find(file => file.type.startsWith('image/'))

      if (imageFile) {
        handleFileUpload(imageFile)
      }
    },
    [handleFileUpload],
  )

  // Effects
  useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      startScanning()
    }
    else {
      stopScanning()
    }

    return () => {
      stopScanning()
    }
  }, [isOpen, scanMode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        stopScanning()
      }
    }
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Entwickler Barcode Scanner
          </DialogTitle>
          <DialogDescription>
            Erweiterte Scanner mit Leistungsdiagnostik und Geräteinformationen
          </DialogDescription>
        </DialogHeader>

        {/* Device Information Card */}
        {deviceInfo && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Geräteinformationen
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Plattform:</span>
                  <Badge variant="outline" className="text-xs">
                    {deviceInfo.platform}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Mobil:</span>
                  <Badge
                    variant={deviceInfo.isMobile ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {deviceInfo.isMobile ? 'Ja' : 'Nein'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Kameras:</span>
                  <Badge variant="outline" className="text-xs">
                    {deviceInfo.cameraCount}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>FPS:</span>
                  <Badge variant="outline" className="text-xs">
                    {fps}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mode Selection */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={scanMode === 'camera' ? 'default' : 'outline'}
            onClick={() => handleModeSwitch('camera')}
            className="flex-1"
            disabled={isLoading || isProcessingFile}
          >
            <Camera className="h-4 w-4 mr-2" />
            Kamera Scannen
          </Button>
          <Button
            variant={scanMode === 'upload' ? 'default' : 'outline'}
            onClick={() => handleModeSwitch('upload')}
            className="flex-1"
            disabled={isLoading || isProcessingFile}
          >
            <Upload className="h-4 w-4 mr-2" />
            Bild hochladen
          </Button>
        </div>

        {/* Scanner Progress */}
        {scanMode === 'camera' && (isLoading || scanProgress > 0) && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Scanner-Status</span>
            </div>
            <Progress value={scanProgress} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{isLoading ? 'Initialisiere...' : 'Bereit'}</span>
              <span>
                {scanProgress}
                %
              </span>
            </div>
          </div>
        )}

        {/* Scanner Settings */}
        {scannerSettings && scanMode === 'camera' && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Scanner-Konfiguration
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium">{scannerSettings.fps}</div>
                  <div className="text-muted-foreground">FPS</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">
                    {scannerSettings.qrbox.width}
                    ×
                    {scannerSettings.qrbox.height}
                  </div>
                  <div className="text-muted-foreground">Scanbereich</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">
                    {scannerSettings.aspectRatio}
                  </div>
                  <div className="text-muted-foreground">Seitenverhältnis</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scanner Display */}
        <div className="relative mb-4">
          {scanMode === 'camera' ? (
            <div className="relative">
              <div
                id={scannerId}
                className={`w-80 h-80 mx-auto border-2 border-dashed rounded-lg overflow-hidden transition-all duration-300 ${
                  flashFeedback === 'success'
                    ? 'border-green-500 bg-green-50 shadow-lg shadow-green-200'
                    : flashFeedback === 'error'
                      ? 'border-red-500 bg-red-50 shadow-lg shadow-red-200'
                      : 'border-gray-300'
                }`}
              />

              {/* Flash Feedback Overlay */}
              {flashFeedback && (
                <div
                  className={`absolute inset-0 flex items-center justify-center rounded-lg transition-all duration-300 ${
                    flashFeedback === 'success'
                      ? 'bg-green-500/30 border-2 border-green-500'
                      : 'bg-red-500/30 border-2 border-red-500'
                  }`}
                >
                  <div
                    className={`text-center font-bold text-2xl ${
                      flashFeedback === 'success'
                        ? 'text-green-800'
                        : 'text-red-800'
                    }`}
                  >
                    {flashFeedback === 'success' ? '✓ DETECTED!' : '✗ ERROR!'}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="text-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Starte Kamera...</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {isProcessingFile
                ? (
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p>Verarbeite Bild...</p>
                    </div>
                  )
                : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-lg font-medium">Barcode-Bild hochladen</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Klicken zum Auswählen oder Bild hierher ziehen
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Unterstützt: JPG, PNG, GIF, WebP
                      </p>
                    </div>
                  )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* Error Display */}
        {(error || uploadError) && (
          <Alert variant="destructive" className="mb-4">
            <X className="h-4 w-4" />
            <AlertDescription>{error || uploadError}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
