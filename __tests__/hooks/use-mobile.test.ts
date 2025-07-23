/**
 * Tests for useIsMobile hook
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { useIsMobile } from "@/hooks/use-mobile";

// Mock window and navigator
const mockWindow = {
    innerWidth: 1024,
    matchMedia: vi.fn(),
};

const mockNavigator = {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
};

// Mock media query list
const createMockMediaQueryList = (matches: boolean) => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
});

describe("useIsMobile", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(window, "innerWidth", {
            writable: true,
            configurable: true,
            value: mockWindow.innerWidth,
        });
        Object.defineProperty(window, "matchMedia", {
            writable: true,
            configurable: true,
            value: mockWindow.matchMedia,
        });
        Object.defineProperty(navigator, "userAgent", {
            writable: true,
            configurable: true,
            value: mockNavigator.userAgent,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should return false for desktop screen size", () => {
        window.innerWidth = 1024;
        const mockMQL = createMockMediaQueryList(false);
        mockWindow.matchMedia.mockReturnValue(mockMQL);

        const { result } = renderHook(() => useIsMobile());
        
        expect(result.current).toBe(false);
    });

    it("should return true for mobile screen size", () => {
        window.innerWidth = 600;
        const mockMQL = createMockMediaQueryList(true);
        mockWindow.matchMedia.mockReturnValue(mockMQL);

        const { result } = renderHook(() => useIsMobile());
        
        expect(result.current).toBe(true);
    });

    it("should detect iPhone user agent", () => {
        window.innerWidth = 1024; // Desktop size
        navigator.userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)";
        const mockMQL = createMockMediaQueryList(false);
        mockWindow.matchMedia.mockReturnValue(mockMQL);

        const { result } = renderHook(() => useIsMobile());
        
        expect(result.current).toBe(true);
    });

    it("should detect iPad user agent", () => {
        window.innerWidth = 1024;
        navigator.userAgent = "Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X)";
        const mockMQL = createMockMediaQueryList(false);
        mockWindow.matchMedia.mockReturnValue(mockMQL);

        const { result } = renderHook(() => useIsMobile());
        
        expect(result.current).toBe(true);
    });

    it("should detect Android user agent", () => {
        window.innerWidth = 1024;
        navigator.userAgent = "Mozilla/5.0 (Linux; Android 11; SM-G991B)";
        const mockMQL = createMockMediaQueryList(false);
        mockWindow.matchMedia.mockReturnValue(mockMQL);

        const { result } = renderHook(() => useIsMobile());
        
        expect(result.current).toBe(true);
    });

    it("should not detect desktop user agent as mobile", () => {
        window.innerWidth = 1024;
        navigator.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
        const mockMQL = createMockMediaQueryList(false);
        mockWindow.matchMedia.mockReturnValue(mockMQL);

        const { result } = renderHook(() => useIsMobile());
        
        expect(result.current).toBe(false);
    });

    it("should set up media query listener", () => {
        const mockMQL = createMockMediaQueryList(false);
        mockWindow.matchMedia.mockReturnValue(mockMQL);

        renderHook(() => useIsMobile());
        
        expect(mockWindow.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
        expect(mockMQL.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    });

    it("should respond to media query changes", () => {
        let changeHandler: (() => void) | undefined;
        const mockMQL = createMockMediaQueryList(false);
        mockMQL.addEventListener.mockImplementation((event, handler) => {
            if (event === "change") {
                changeHandler = handler as () => void;
            }
        });
        mockWindow.matchMedia.mockReturnValue(mockMQL);

        const { result } = renderHook(() => useIsMobile());
        
        expect(result.current).toBe(false);

        // Simulate screen size change to mobile
        act(() => {
            window.innerWidth = 600;
            changeHandler?.();
        });

        expect(result.current).toBe(true);
    });

    it("should clean up media query listener on unmount", () => {
        const mockMQL = createMockMediaQueryList(false);
        mockWindow.matchMedia.mockReturnValue(mockMQL);

        const { unmount } = renderHook(() => useIsMobile());
        
        unmount();
        
        expect(mockMQL.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    });

    it("should handle edge case at exact breakpoint", () => {
        window.innerWidth = 768; // Exactly at breakpoint
        const mockMQL = createMockMediaQueryList(false);
        mockWindow.matchMedia.mockReturnValue(mockMQL);

        const { result } = renderHook(() => useIsMobile());
        
        expect(result.current).toBe(false); // 768 should be considered desktop
    });

    it("should handle edge case just below breakpoint", () => {
        window.innerWidth = 767; // Just below breakpoint
        const mockMQL = createMockMediaQueryList(true);
        mockWindow.matchMedia.mockReturnValue(mockMQL);

        const { result } = renderHook(() => useIsMobile());
        
        expect(result.current).toBe(true);
    });

    it("should return true when either condition is met", () => {
        // Desktop size but mobile user agent
        window.innerWidth = 1024;
        navigator.userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)";
        const mockMQL = createMockMediaQueryList(false);
        mockWindow.matchMedia.mockReturnValue(mockMQL);

        const { result } = renderHook(() => useIsMobile());
        
        expect(result.current).toBe(true);
    });
});