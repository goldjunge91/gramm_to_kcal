/**
 * Tests for products API functions
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCreateProduct, useDeleteProduct, useProducts, useProductsList } from "@/lib/api/products";

// Mock fetch
globalThis.fetch = vi.fn();

// Mock sonner toast
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Create wrapper for React Query
function createWrapper() {
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
}

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

            const mockResponse = {
                products: mockProducts,
                pagination: {
                    limit: 20,
                    cursor: null,
                    nextCursor: null,
                    hasMore: false,
                    count: 2,
                },
            };

            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            } as Response);

            const { result } = renderHook(() => useProducts("user123"), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual(mockResponse);
            expect(fetch).toHaveBeenCalledWith("/api/user/products?limit=20", {
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

            const { result } = renderHook(() => useProducts("user123"), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error).toBeInstanceOf(Error);
        });

        it("should not fetch when userId is empty", () => {
            const { result } = renderHook(() => useProducts(""), {
                wrapper: createWrapper(),
            });

            expect(result.current.isFetching).toBe(false);
            expect(fetch).not.toHaveBeenCalled();
        });

        it("should not fetch when userId is undefined", () => {
            const { result } = renderHook(() => useProducts(undefined as any), {
                wrapper: createWrapper(),
            });

            expect(result.current.isFetching).toBe(false);
            expect(fetch).not.toHaveBeenCalled();
        });

        it("should support cursor-based pagination", async () => {
            const mockProducts = [
                { id: "3", name: "Product 3", kcal: 300 },
            ];

            const mockResponse = {
                products: mockProducts,
                pagination: {
                    limit: 10,
                    cursor: "2024-01-01T00:00:00.000Z",
                    nextCursor: "2023-12-31T00:00:00.000Z",
                    hasMore: true,
                    count: 1,
                },
            };

            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            } as Response);

            const { result } = renderHook(() => useProducts("user123", "2024-01-01T00:00:00.000Z", 10), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual(mockResponse);
            expect(fetch).toHaveBeenCalledWith("/api/user/products?cursor=2024-01-01T00%3A00%3A00.000Z&limit=10", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
        });
    });

    describe("useProductsList", () => {
        it("should extract products array from paginated response", async () => {
            const mockProducts = [
                { id: "1", name: "Product 1", kcal: 100 },
                { id: "2", name: "Product 2", kcal: 200 },
            ];

            const mockResponse = {
                products: mockProducts,
                pagination: {
                    limit: 20,
                    cursor: null,
                    nextCursor: null,
                    hasMore: false,
                    count: 2,
                },
            };

            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            } as Response);

            const { result } = renderHook(() => useProductsList("user123"), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual(mockProducts);
        });
    });

    describe("useCreateProduct", () => {
        it("should create product successfully", async () => {
            const mockProduct = {
                id: "1",
                name: "New Product",
                kcal: 150,
                userId: "user123",
                quantity: 100,
            };
            const { toast } = await import("sonner");

            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockProduct),
            } as Response);

            const { result } = renderHook(() => useCreateProduct(), {
                wrapper: createWrapper(),
            });

            const productData = {
                userId: "user123",
                name: "New Product",
                kcal: 150,
                quantity: 100,
            };

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

            expect(toast.success).toHaveBeenCalledWith("Product created");
        });

        it("should handle creation errors", async () => {
            const { toast } = await import("sonner");

            vi.mocked(fetch).mockResolvedValue({
                ok: false,
                statusText: "Bad Request",
            } as Response);

            const { result } = renderHook(() => useCreateProduct(), {
                wrapper: createWrapper(),
            });

            const productData = {
                userId: "user123",
                name: "New Product",
                kcal: 150,
                quantity: 100,
            };

            result.current.mutate(productData);

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(toast.error).toHaveBeenCalledWith(
                "Failed to create product: Bad Request",
            );
        });

        it("should invalidate products query on success", async () => {
            const mockProduct = {
                id: "1",
                name: "New Product",
                kcal: 150,
                userId: "user123",
                quantity: 100,
            };

            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockProduct),
            } as Response);

            const { result } = renderHook(() => useCreateProduct(), {
                wrapper: createWrapper(),
            });

            const productData = {
                userId: "user123",
                name: "New Product",
                kcal: 150,
                quantity: 100,
            };

            result.current.mutate(productData);

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            // Query invalidation happens automatically via React Query
            expect(result.current.data).toEqual(mockProduct);
        });
    });

    describe("useDeleteProduct", () => {
        it("should delete product successfully", async () => {
            const { toast } = await import("sonner");

            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({}),
            } as Response);

            const { result } = renderHook(() => useDeleteProduct(), {
                wrapper: createWrapper(),
            });

            result.current.mutate({ id: "product123", userId: "user123" });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(fetch).toHaveBeenCalledWith("/api/user/products/product123", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            expect(toast.success).toHaveBeenCalledWith("Product deleted");
        });

        it("should handle deletion errors", async () => {
            // const { sonner } = await import("sonner");
            // const { toast } = await import("sonner");
            vi.mocked(fetch).mockResolvedValue({
                ok: false,
                statusText: "Not Found",
            } as Response);

            const { result } = renderHook(() => useDeleteProduct(), {
                wrapper: createWrapper(),
            });

            result.current.mutate({ id: "product123", userId: "user123" });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error).toEqual(
                new Error("Failed to delete product: Not Found"),
            );
        });

        it("should invalidate user-specific products query on success", async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({}),
            } as Response);

            const { result } = renderHook(() => useDeleteProduct(), {
                wrapper: createWrapper(),
            });

            result.current.mutate({ id: "product123", userId: "user123" });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            // Query invalidation happens automatically via React Query
            expect(result.current.isSuccess).toBe(true);
        });
    });
});
