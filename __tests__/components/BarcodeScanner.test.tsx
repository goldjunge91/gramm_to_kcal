/* eslint-disable @typescript-eslint/no-require-imports */
/* /eslint-disable */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BarcodeScanner } from "../../components/BarcodeScanner";

vi.mock("html5-qrcode", () => {
  const { vi } = require("vitest");

  // Create mock functions inside the factory
  const mockStart = vi.fn();
  const mockStop = vi.fn();
  const mockClear = vi.fn();
  const mockGetState = vi.fn();
  const mockGetCameras = vi.fn();

  // Create a mock class inside the factory
  class MockHtml5Qrcode {
    start = mockStart;
    stop = mockStop;
    clear = mockClear;
    getState = mockGetState;

    static getCameras = mockGetCameras;
  }

  return {
    Html5Qrcode: MockHtml5Qrcode,
    Html5QrcodeScannerState: {
      SCANNING: "SCANNING",
      PAUSED: "PAUSED",
      NOT_STARTED: "NOT_STARTED",
    },
  };
});

// Access the mocked functions
const { Html5Qrcode } =
  await vi.importMock<typeof import("html5-qrcode")>("html5-qrcode");
const mockStart = Html5Qrcode.prototype.start;
const mockStop = Html5Qrcode.prototype.stop;
const mockClear = Html5Qrcode.prototype.clear;
const mockGetState = Html5Qrcode.prototype.getState;
const mockGetCameras = Html5Qrcode.getCameras;

// Mock window.innerWidth for mobile detection
Object.defineProperty(window, "innerWidth", {
  writable: true,
  configurable: true,
  value: 1024,
});

describe("BarcodeScanner", () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    onScan: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockGetCameras.mockResolvedValue([
      { id: "camera1", label: "Front Camera" },
      { id: "camera2", label: "Back Camera (environment)" },
    ]);

    mockStart.mockResolvedValue(undefined);
    mockStop.mockResolvedValue(undefined);
    mockClear.mockResolvedValue(undefined);
    mockGetState.mockReturnValue("SCANNING");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Component Rendering", () => {
    it("should not render when isOpen is false", () => {
      render(<BarcodeScanner {...mockProps} isOpen={false} />);

      expect(screen.queryByText("Barcode Scanner")).not.toBeInTheDocument();
    });

    it("should render mobile version when isOpen is true", () => {
      // Set mobile width
      window.innerWidth = 500;

      render(<BarcodeScanner {...mockProps} />);

      expect(screen.getByText("Barcode Scanner")).toBeInTheDocument();
      expect(
        screen.getByText("Richte die Kamera auf einen Barcode (EAN-13)"),
      ).toBeInTheDocument();
    });

    it("should render desktop version for wider screens", () => {
      // Set desktop width
      window.innerWidth = 1024;

      render(<BarcodeScanner {...mockProps} />);

      expect(screen.getByText("Barcode Scanner")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Richte die Kamera auf einen Barcode (EAN-13) für automatische Produkterkennung",
        ),
      ).toBeInTheDocument();
    });

    it("should show loading state initially", () => {
      render(<BarcodeScanner {...mockProps} />);

      expect(
        screen.getByText("Kamera wird initialisiert..."),
      ).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument(); // Loading spinner
    });
  });

  describe("Camera Initialization", () => {
    it("should select back camera when available", async () => {
      mockGetCameras.mockResolvedValue([
        { id: "front", label: "Front Camera" },
        { id: "back", label: "Back Camera (environment)" },
      ]);

      render(<BarcodeScanner {...mockProps} />);

      await waitFor(() => {
        expect(mockStart).toHaveBeenCalledWith(
          "back", // Should select the back camera
          expect.objectContaining({
            fps: 10,
            qrbox: { width: 250, height: 150 },
          }),
          expect.any(Function),
          expect.any(Function),
        );
      });
    });

    it("should handle camera initialization errors", async () => {
      mockGetCameras.mockRejectedValue(new Error("Camera access denied"));

      render(<BarcodeScanner {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText("Camera access denied")).toBeInTheDocument();
        expect(mockProps.onError).toHaveBeenCalledWith("Camera access denied");
      });
    });

    it("should handle no cameras available", async () => {
      mockGetCameras.mockResolvedValue([]);

      render(<BarcodeScanner {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText("No cameras found on this device"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Barcode Scanning", () => {
    it("should handle successful barcode scan", async () => {
      let scanSuccessCallback: (text: string, result: any) => void;

      mockStart.mockImplementation((cameraId, config, onSuccess, _onFailure) => {
        scanSuccessCallback = onSuccess;
        return Promise.resolve();
      });

      render(<BarcodeScanner {...mockProps} />);

      await waitFor(() => {
        expect(mockStart).toHaveBeenCalled();
      });

      // Simulate successful scan
      const mockBarcode = "1234567890123";
      const mockResult = { format: "EAN_13" };

      scanSuccessCallback!(mockBarcode, mockResult);

      expect(mockProps.onScan).toHaveBeenCalledWith(mockBarcode);
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it("should handle scan failures gracefully", async () => {
      let scanFailureCallback: (error: string) => void;

      mockStart.mockImplementation((cameraId, config, onSuccess, _onFailure) => {
        scanFailureCallback = onFailure;
        return Promise.resolve();
      });

      render(<BarcodeScanner {...mockProps} />);

      await waitFor(() => {
        expect(mockStart).toHaveBeenCalled();
      });

      // Simulate scan failure (should not throw or show error)
      scanFailureCallback!("No barcode found");

      // Should not call onError for normal scan failures
      expect(mockProps.onError).not.toHaveBeenCalled();
    });
  });

  describe("Component Cleanup", () => {
    it("should stop scanning when modal closes", async () => {
      const { rerender } = render(<BarcodeScanner {...mockProps} />);

      await waitFor(() => {
        expect(mockStart).toHaveBeenCalled();
      });

      // Close the modal
      rerender(<BarcodeScanner {...mockProps} isOpen={false} />);

      await waitFor(() => {
        expect(mockStop).toHaveBeenCalled();
        expect(mockClear).toHaveBeenCalled();
      });
    });

    it("should handle cleanup errors gracefully", async () => {
      mockStop.mockRejectedValue(new Error("Stop failed"));
      mockClear.mockRejectedValue(new Error("Clear failed"));

      const { rerender } = render(<BarcodeScanner {...mockProps} />);

      await waitFor(() => {
        expect(mockStart).toHaveBeenCalled();
      });

      // Should not throw when cleanup fails
      expect(() => {
        rerender(<BarcodeScanner {...mockProps} isOpen={false} />);
      }).not.toThrow();
    });
  });

  describe("User Interactions", () => {
    it("should close scanner when close button is clicked", () => {
      render(<BarcodeScanner {...mockProps} />);

      const closeButton = screen.getByRole("button", {
        name: /close|schließen/i,
      });
      fireEvent.click(closeButton);

      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it("should show retry button when there's an error", async () => {
      mockGetCameras.mockRejectedValue(new Error("Camera error"));

      render(<BarcodeScanner {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText("Erneut versuchen")).toBeInTheDocument();
      });

      const retryButton = screen.getByText("Erneut versuchen");
      fireEvent.click(retryButton);

      // Should attempt to restart scanning
      await waitFor(() => {
        expect(mockGetCameras).toHaveBeenCalledTimes(2);
      });
    });

    it("should show cancel button on desktop", () => {
      window.innerWidth = 1024;

      render(<BarcodeScanner {...mockProps} />);

      expect(screen.getByText("Abbrechen")).toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("should use mobile element ID for narrow screens", () => {
      window.innerWidth = 500;

      render(<BarcodeScanner {...mockProps} />);

      const mobileElement = document.querySelector("#mobile-barcode-scanner");
      expect(mobileElement).toBeInTheDocument();
    });

    it("should use desktop element ID for wide screens", () => {
      window.innerWidth = 1024;

      render(<BarcodeScanner {...mockProps} />);

      const desktopElement = document.querySelector("#desktop-barcode-scanner");
      expect(desktopElement).toBeInTheDocument();
    });
  });

  describe("Configuration", () => {
    it("should use iOS-optimized settings", async () => {
      render(<BarcodeScanner {...mockProps} />);

      await waitFor(() => {
        expect(mockStart).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.777778,
            disableFlip: false,
            videoConstraints: expect.objectContaining({
              width: { ideal: 1280, min: 640, max: 1920 },
              height: { ideal: 720, min: 480, max: 1080 },
              aspectRatio: { ideal: 16 / 9 },
              frameRate: { ideal: 15, min: 10, max: 30 },
              facingMode: { ideal: "environment" },
            }),
          }),
          expect.any(Function),
          expect.any(Function),
        );
      });
    });
  });
});
