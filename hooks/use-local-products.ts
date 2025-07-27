/**
 * Local storage hook for managing products without authentication
 * Uses sessionStorage for temporary session-only data storage
 * Data is automatically cleared when browser session ends or page reloads
 */

import { useCallback, useEffect, useState } from "react";

import type { Product } from "@/types/types";

import { env } from "@/lib/env";
import { createLogger } from "@/lib/utils/logger";

const STORAGE_KEY = env.STORAGE_KEY!;

interface LocalProduct extends Omit<Product, "id"> {
    id: string;
    createdAt: string;
}

/**
 * Generate a simple ID for local products
 */
function generateLocalId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Hook for managing products in sessionStorage for unauthenticated users
 * Provides the same interface as the database hook for consistency
 * Uses sessionStorage so data is cleared on page reload/session end
 */
export function useLocalProducts() {
    const logger = createLogger();
    const [products, setProducts] = useState<LocalProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load products from sessionStorage on mount
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsedProducts = JSON.parse(stored) as LocalProduct[];
                setProducts(parsedProducts);
            }
        }
        catch (error) {
            logger.warn("Failed to load products from sessionStorage", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                storageKey: STORAGE_KEY,
                context: "local_products_load",
            });
            setProducts([]);
        }
        finally {
            setIsLoading(false);
        }
    }, []);

    // Save products to sessionStorage whenever they change
    const saveToStorage = useCallback((newProducts: LocalProduct[]) => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newProducts));
            setProducts(newProducts);
        }
        catch (error) {
            logger.error("Failed to save products to sessionStorage", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                productCount: newProducts.length,
                storageKey: STORAGE_KEY,
                context: "local_products_save",
            });
        }
    }, []);

    // Add a new product
    const addProduct = useCallback(
        (productData: Omit<Product, "id">) => {
            const newProduct: LocalProduct = {
                ...productData,
                id: generateLocalId(),
                createdAt: new Date().toISOString(),
            };

            const updatedProducts = [newProduct, ...products];
            saveToStorage(updatedProducts);
            return newProduct;
        },
        [products, saveToStorage],
    );

    // Delete a product
    const deleteProduct = useCallback(
        (id: string) => {
            const updatedProducts = products.filter(p => p.id !== id);
            saveToStorage(updatedProducts);
        },
        [products, saveToStorage],
    );

    // Update a product
    const updateProduct = useCallback(
        (id: string, updates: Partial<Omit<Product, "id">>) => {
            const updatedProducts = products.map(p =>
                p.id === id ? { ...p, ...updates } : p,
            );
            saveToStorage(updatedProducts);
        },
        [products, saveToStorage],
    );

    // Clear all products
    const clearProducts = useCallback(() => {
        try {
            sessionStorage.removeItem(STORAGE_KEY);
            setProducts([]);
        }
        catch (error) {
            logger.error("Failed to clear products from sessionStorage", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                storageKey: STORAGE_KEY,
                context: "local_products_clear",
            });
        }
    }, []);

    // Get product count
    const getProductCount = useCallback(() => products.length, [products]);

    // Convert to Product format (remove createdAt for compatibility)
    const getProducts = useCallback((): Product[] => {
        return products.map(({ createdAt, ...product }) => product);
    }, [products]);

    return {
        // Data
        products: getProducts(),
        isLoading,

        // Actions
        addProduct,
        deleteProduct,
        updateProduct,
        clearProducts,

        // Utils
        getProductCount,
    };
}

/**
 * Hook that provides React Query-like interface for local products
 * This ensures compatibility with existing components
 */
export function useLocalProductsQuery() {
    const {
        products,
        isLoading,
        addProduct,
        deleteProduct,
        updateProduct,
        clearProducts,
    } = useLocalProducts();

    // Create React Query-like interface
    const query = {
        data: products,
        isLoading,
        error: null,
        refetch: () => Promise.resolve({ data: products }),
    };

    const createMutation = {
        mutateAsync: (productData: Omit<Product, "id">) => {
            return Promise.resolve(addProduct(productData));
        },
        isPending: false,
    };

    const deleteMutation = {
        mutateAsync: (id: string) => {
            deleteProduct(id);
            return Promise.resolve({ id });
        },
        isPending: false,
    };

    const updateMutation = {
        mutateAsync: (data: {
            id: string;
            updates: Partial<Omit<Product, "id">>;
        }) => {
            updateProduct(data.id, data.updates);
            return Promise.resolve(data);
        },
        isPending: false,
    };

    return {
        query,
        createMutation,
        deleteMutation,
        updateMutation,
        clearProducts,
    };
}
