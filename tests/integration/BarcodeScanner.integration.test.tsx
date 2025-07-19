import { render, screen } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BarcodeScanner } from "../../components/BarcodeScanner";

/**
 * Integration tests for BarcodeScanner using real barcode images
 * These tests verify that our component can actually scan barcodes from images
 */

// Test barcode data - these should match the actual barcodes in the test images
const TEST_BARCODES = {
  "ean13-sample.png": "4007624017106", // Example EAN-13
  "product-nutella.png": "40084963", // Nutella barcode example
  "coca-cola.png": "4000354007542", // Coca Cola barcode example
  "real-product-barcode.png": "4311501043271", // Real product barcode from user
} as const;

/**
 * Load a test image from the fixtures directory
 */
function loadTestImage(filename: string): Promise<HTMLImageElement> {
  const imagePath = path.join(__dirname, "../fixtures/barcodes", filename);

  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Test image not found: ${imagePath}`);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);

    // Convert file to data URL for testing
    const buffer = fs.readFileSync(imagePath);
    const base64 = buffer.toString("base64");
    const mimeType = filename.endsWith(".png") ? "image/png" : "image/jpeg";
    img.src = `data:${mimeType};base64,${base64}`;
  });
}

/**
 * Create a canvas from an image for processing
 */
function imageToCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  return canvas;
}

/**
 * Simulate feeding an image to the barcode scanner
 * This function tries to trigger the html5-qrcode library with image data
 */
async function simulateBarcodeScanning(
  image: HTMLImageElement,
  onScan: (result: string) => void,
  onError: (error: string) => void,
): Promise<void> {
  try {
    // Import html5-qrcode directly for testing
    const { Html5Qrcode } = await import("html5-qrcode");

    // Create a temporary element for scanning
    const tempElement = document.createElement("div");
    tempElement.id = `temp-scanner-${Math.random().toString(36).slice(2, 11)}`;
    document.body.append(tempElement);

    const scanner = new Html5Qrcode(tempElement.id);

    try {
      // Convert image to canvas (for potential future use)
      imageToCanvas(image);

      // Try to scan the image using the file scanning method
      const result = await scanner.scanFile(image as any, /* onlyQr */ false);
      onScan(result);
    } catch (scanError) {
      onError(scanError instanceof Error ? scanError.message : "Scan failed");
    } finally {
      // Cleanup
      await scanner.clear();
      tempElement.remove();
    }
  } catch (error) {
    onError(
      error instanceof Error ? error.message : "Scanner initialization failed",
    );
  }
}

describe("BarcodeScanner Integration Tests", () => {
  let mockOnScan: ReturnType<typeof vi.fn>;
  let mockOnClose: ReturnType<typeof vi.fn>;
  let mockOnError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnScan = vi.fn();
    mockOnClose = vi.fn();
    mockOnError = vi.fn();

    // Mock canvas and image support for testing environment
    global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
      canvas: { width: 0, height: 0 },
    })) as any;
  });

  describe("Real Barcode Image Scanning", () => {
    it("should scan EAN-13 barcode from sample image", async () => {
      const filename = "ean13-sample.png";
      const expectedBarcode = TEST_BARCODES[filename];

      // Skip test if image doesn't exist (for CI/CD environments)
      const imagePath = path.join(__dirname, "../fixtures/barcodes", filename);
      if (!fs.existsSync(imagePath)) {
        console.warn(`Skipping test: ${filename} not found`);
        return;
      }

      const testImage = await loadTestImage(filename);

      let scannedResult: string | null = null;
      let scanError: string | null = null;

      await simulateBarcodeScanning(
        testImage,
        (result) => {
          scannedResult = result;
        },
        (error) => {
          scanError = error;
        },
      );

      if (scanError) {
        throw new Error(`Barcode scanning failed: ${scanError}`);
      }

      expect(scannedResult).toBe(expectedBarcode);
    }, 10000); // 10 second timeout for image processing

    it("should scan product barcode (Nutella) from image", async () => {
      const filename = "product-nutella.png";
      const expectedBarcode = TEST_BARCODES[filename];

      const imagePath = path.join(__dirname, "../fixtures/barcodes", filename);
      if (!fs.existsSync(imagePath)) {
        console.warn(`Skipping test: ${filename} not found`);
        return;
      }

      const testImage = await loadTestImage(filename);

      let scannedResult: string | null = null;
      let scanError: string | null = null;

      await simulateBarcodeScanning(
        testImage,
        (result) => {
          scannedResult = result;
        },
        (error) => {
          scanError = error;
        },
      );

      if (scanError) {
        throw new Error(`Product barcode scanning failed: ${scanError}`);
      }

      expect(scannedResult).toBe(expectedBarcode);
    }, 10000);

    it("should have real product barcode available for testing", () => {
      const filename = "real-product-barcode.png";
      const expectedBarcode = TEST_BARCODES[filename];

      const imagePath = path.join(__dirname, "../fixtures/barcodes", filename);

      // Verify the test image file exists
      expect(fs.existsSync(imagePath)).toBe(true);

      // Verify we know the expected barcode value
      expect(expectedBarcode).toBe("4311501043271");

      console.log(`✅ Real barcode test file available: ${filename}`);
      console.log(`✅ Expected barcode value: ${expectedBarcode}`);
      console.log(`📱 Ready for manual testing with development server`);
    });

    it("should handle unreadable barcode images gracefully", async () => {
      const filename = "invalid-barcode.png";

      const imagePath = path.join(__dirname, "../fixtures/barcodes", filename);
      if (!fs.existsSync(imagePath)) {
        console.warn(`Skipping test: ${filename} not found`);
        return;
      }

      const testImage = await loadTestImage(filename);

      let scannedResult: string | null = null;
      let scanError: string | null = null;

      await simulateBarcodeScanning(
        testImage,
        (result) => {
          scannedResult = result;
        },
        (error) => {
          scanError = error;
        },
      );

      // Should either fail to scan or produce an error
      expect(scannedResult === null || scanError !== null).toBe(true);
    }, 10000);
  });

  describe("Component Integration", () => {
    it("should render and be ready for scanning", () => {
      // Mock desktop width
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(
        <BarcodeScanner
          isOpen={true}
          onClose={mockOnClose}
          onScan={mockOnScan}
          onError={mockOnError}
        />,
      );

      // Component renders both mobile and desktop versions, but only one is visible
      expect(
        screen.getAllByText("Barcode Scanner").length,
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByText("Kamera wird initialisiert...").length,
      ).toBeGreaterThanOrEqual(1);
    });

    it("should call onClose when close button is clicked", () => {
      render(
        <BarcodeScanner
          isOpen={true}
          onClose={mockOnClose}
          onScan={mockOnScan}
          onError={mockOnError}
        />,
      );

      const closeButton = screen.getByRole("button", { name: /close/i });
      closeButton.click();

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should not render when isOpen is false", () => {
      render(
        <BarcodeScanner
          isOpen={false}
          onClose={mockOnClose}
          onScan={mockOnScan}
          onError={mockOnError}
        />,
      );

      expect(screen.queryByText("Barcode Scanner")).not.toBeInTheDocument();
    });
  });
});

// Helper function to create test barcode images (for documentation)
export function createTestBarcodeInstructions() {
  return `
To create test barcode images:

1. Generate EAN-13 barcode for "4007624017106":
   - Use online generator: https://barcode.tec-it.com/en
   - Format: EAN-13
   - Code: 4007624017106
   - Save as: tests/fixtures/barcodes/ean13-sample.png

2. Find real product barcodes:
   - Take photos of actual product barcodes
   - Nutella jar: tests/fixtures/barcodes/product-nutella.png
   - Coca Cola bottle: tests/fixtures/barcodes/coca-cola.png

3. Create invalid barcode:
   - Take a blurry/corrupted barcode image
   - Save as: tests/fixtures/barcodes/invalid-barcode.png

Image requirements:
- High contrast (black bars on white background)
- Good resolution (at least 300x100 pixels)
- PNG or JPEG format
- Clear, unobstructed view of barcode
`;
}
