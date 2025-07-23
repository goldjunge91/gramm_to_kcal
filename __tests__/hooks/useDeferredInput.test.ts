/**
 * Tests for useDeferredInput hook
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useDeferredInput } from "@/hooks/useDeferredInput";

describe("useDeferredInput", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should initialize with initial value", () => {
        const onCommit = vi.fn();
        const { result } = renderHook(() =>
            useDeferredInput({
                initialValue: 42,
                onCommit,
            }),
        );

        expect(result.current.displayValue).toBe("42");
        expect(result.current.isDirty).toBe(false);
    });

    it("should handle input changes", () => {
        const onCommit = vi.fn();
        const { result } = renderHook(() =>
            useDeferredInput({
                initialValue: 42,
                onCommit,
            }),
        );

        act(() => {
            result.current.handleChange({
                target: { value: "100" },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        expect(result.current.displayValue).toBe("100");
        expect(result.current.isDirty).toBe(true);
        expect(onCommit).not.toHaveBeenCalled();
    });

    it("should commit value on blur", () => {
        const onCommit = vi.fn();
        const { result } = renderHook(() =>
            useDeferredInput({
                initialValue: 42,
                onCommit,
            }),
        );

        act(() => {
            result.current.handleChange({
                target: { value: "100" },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        act(() => {
            result.current.handleBlur();
        });

        expect(onCommit).toHaveBeenCalledWith(100);
        expect(result.current.isDirty).toBe(false);
    });

    it("should commit value on Enter key", () => {
        const onCommit = vi.fn();
        const mockBlur = vi.fn();
        const { result } = renderHook(() =>
            useDeferredInput({
                initialValue: 42,
                onCommit,
            }),
        );

        act(() => {
            result.current.handleChange({
                target: { value: "100" },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        act(() => {
            result.current.handleKeyDown({
                key: "Enter",
                preventDefault: vi.fn(),
                target: { blur: mockBlur },
            } as any);
        });

        expect(onCommit).toHaveBeenCalledWith(100);
        expect(mockBlur).toHaveBeenCalled();
    });

    it("should reset value on Escape key", () => {
        const onCommit = vi.fn();
        const mockBlur = vi.fn();
        const { result } = renderHook(() =>
            useDeferredInput({
                initialValue: 42,
                onCommit,
            }),
        );

        act(() => {
            result.current.handleChange({
                target: { value: "100" },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        act(() => {
            result.current.handleKeyDown({
                key: "Escape",
                preventDefault: vi.fn(),
                target: { blur: mockBlur },
            } as any);
        });

        expect(result.current.displayValue).toBe("42");
        expect(result.current.isDirty).toBe(false);
        expect(onCommit).not.toHaveBeenCalled();
        expect(mockBlur).toHaveBeenCalled();
    });

    it("should use custom validator", () => {
        const onCommit = vi.fn();
        const validator = vi.fn().mockReturnValue(false);
        const { result } = renderHook(() =>
            useDeferredInput({
                initialValue: 42,
                onCommit,
                validator,
            }),
        );

        act(() => {
            result.current.handleChange({
                target: { value: "100" },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        act(() => {
            result.current.handleBlur();
        });

        expect(validator).toHaveBeenCalledWith(100);
        expect(onCommit).not.toHaveBeenCalled();
        expect(result.current.displayValue).toBe("42"); // Reset to last valid value
        expect(result.current.isDirty).toBe(false);
    });

    it("should use custom formatter", () => {
        const onCommit = vi.fn();
        const formatter = vi.fn().mockReturnValue("formatted-value");
        const { result } = renderHook(() =>
            useDeferredInput({
                initialValue: "initial",
                onCommit,
                formatter,
            }),
        );

        act(() => {
            result.current.handleChange({
                target: { value: "raw-input" },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        act(() => {
            result.current.handleBlur();
        });

        expect(formatter).toHaveBeenCalledWith("raw-input");
        expect(onCommit).toHaveBeenCalledWith("formatted-value");
    });

    it("should handle invalid number input", () => {
        const onCommit = vi.fn();
        const { result } = renderHook(() =>
            useDeferredInput({
                initialValue: 42,
                onCommit,
            }),
        );

        act(() => {
            result.current.handleChange({
                target: { value: "not-a-number" },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        act(() => {
            result.current.handleBlur();
        });

        expect(onCommit).toHaveBeenCalledWith(42); // Should fallback to committed value
    });

    it("should update when initial value changes", () => {
        const onCommit = vi.fn();
        const { result, rerender } = renderHook(
            ({ initialValue }) =>
                useDeferredInput({
                    initialValue,
                    onCommit,
                }),
            { initialProps: { initialValue: 42 } },
        );

        expect(result.current.displayValue).toBe("42");

        rerender({ initialValue: 100 });

        expect(result.current.displayValue).toBe("100");
        expect(result.current.isDirty).toBe(false);
    });

    it("should handle reset function", () => {
        const onCommit = vi.fn();
        const { result } = renderHook(() =>
            useDeferredInput({
                initialValue: 42,
                onCommit,
            }),
        );

        act(() => {
            result.current.handleChange({
                target: { value: "100" },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        expect(result.current.isDirty).toBe(true);

        act(() => {
            result.current.reset();
        });

        expect(result.current.displayValue).toBe("42");
        expect(result.current.isDirty).toBe(false);
        expect(onCommit).not.toHaveBeenCalled();
    });

    it("should not commit if not dirty", () => {
        const onCommit = vi.fn();
        const { result } = renderHook(() =>
            useDeferredInput({
                initialValue: 42,
                onCommit,
            }),
        );

        act(() => {
            result.current.handleBlur();
        });

        expect(onCommit).not.toHaveBeenCalled();
    });

    it("should handle string values correctly", () => {
        const onCommit = vi.fn();
        const { result } = renderHook(() =>
            useDeferredInput({
                initialValue: "hello",
                onCommit,
                formatter: (value: string) => value.toUpperCase(),
            }),
        );

        act(() => {
            result.current.handleChange({
                target: { value: "world" },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        act(() => {
            result.current.handleBlur();
        });

        expect(onCommit).toHaveBeenCalledWith("WORLD");
    });

    it("should handle complex validation scenarios", () => {
        const onCommit = vi.fn();
        const validator = (value: number) => value >= 0 && value <= 100;
        const { result } = renderHook(() =>
            useDeferredInput({
                initialValue: 50,
                onCommit,
                validator,
            }),
        );

        // Valid value
        act(() => {
            result.current.handleChange({
                target: { value: "75" },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        act(() => {
            result.current.handleBlur();
        });

        expect(onCommit).toHaveBeenCalledWith(75);
        onCommit.mockClear();

        // Invalid value
        act(() => {
            result.current.handleChange({
                target: { value: "150" },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        act(() => {
            result.current.handleBlur();
        });

        expect(onCommit).not.toHaveBeenCalled();
        expect(result.current.displayValue).toBe("75"); // Reset to last valid
    });
});
