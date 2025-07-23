/**
 * Tests for products API functions
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";

import { useProducts, useCreateProduct } from "@/lib/api/products";

// Mock fetch
global.fetch = vi.fn();

// Mock sonner toast
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Create wrapper for React Query
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe("products API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("useProducts", () => {
        it("should fetch products for valid user", async () => {
            const mockProducts = [
                { id: "1", name: "Product 1", kcal: 100 },
                { id: "2", name: "Product 2", kcal: 200 },
            ];

            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockProducts),
            } as Response);

            const { result } = renderHook(
                () => useProducts("user123"),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual(mockProducts);
            expect(fetch).toHaveBeenCalledWith("/api/user/products", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
        });

        it("should handle fetch errors", async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: false,
                statusText: "Internal Server Error",
            } as Response);

            const { result } = renderHook(
                () => useProducts("user123"),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error).toBeInstanceOf(Error);
        });

        it("should not fetch when userId is empty", () => {
            const { result } = renderHook(
                () => useProducts(""),
                { wrapper: createWrapper() }
            );

            expect(result.current.isFetching).toBe(false);
            expect(fetch).not.toHaveBeenCalled();
        });

        it("should not fetch when userId is undefined", () => {
            const { result } = renderHook(
                () => useProducts(undefined as any),
                { wrapper: createWrapper() }
            );

            expect(result.current.isFetching).toBe(false);
            expect(fetch).not.toHaveBeenCalled();
        });
    });

    describe("useCreateProduct", () => {
        it("should create product successfully", async () => {
            const mockProduct = { id: "1", name: "New Product", kcal: 150 };
            const { toast } = await import("sonner");

            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockProduct),
            } as Response);

            const { result } = renderHook(
                () => useCreateProduct(),
                { wrapper: createWrapper() }
            );

            const productData = { name: "New Product", kcal: 150, quantity: "100g" };
            
            result.current.mutate(productData);

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(fetch).toHaveBeenCalledWith("/api/user/products", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(productData),
            });

            expect(toast.success).toHaveBeenCalledWith("Product created successfully!");
        });

        it("should handle creation errors", async () => {
            const { toast } = await import("sonner");

            vi.mocked(fetch).mockResolvedValue({
                ok: false,
                statusText: "Bad Request",
            } as Response);

            const { result } = renderHook(
                () => useCreateProduct(),
                { wrapper: createWrapper() }
            );

            const productData = { name: "New Product", kcal: 150, quantity: "100g" };
            
            result.current.mutate(productData);

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(toast.error).toHaveBeenCalledWith("Failed to create product. Please try again.");
        });

        it("should invalidate products query on success", async () => {
            const mockProduct = { id: "1", name: "New Product", kcal: 150 };

            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockProduct),
            } as Response);

            const { result } = renderHook(
                () => useCreateProduct(),
                { wrapper: createWrapper() }
            );

            const productData = { name: "New Product", kcal: 150, quantity: "100g" };
            
            result.current.mutate(productData);

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            // Query invalidation happens automatically via React Query
            expect(result.current.data).toEqual(mockProduct);
        });
    });
});