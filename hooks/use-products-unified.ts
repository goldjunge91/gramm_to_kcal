/**
 * Unified products hook that handles both authenticated and unauthenticated users
 * - Authenticated users: database storage with sync
 * - Unauthenticated users: localStorage only
 */

import type { Product } from "@/lib/types/types";

import { useAuth } from "@/app/providers";
import {
    useCreateProduct,
    useDeleteProduct,
    useProducts,
} from "@/lib/api/products";

import { useLocalProductsQuery } from "./use-local-products";

interface UnifiedProductsReturn {
    // Data
    data: Product[];
    isLoading: boolean;
    error: Error | null;

    // Actions
    addProduct: (productData: Omit<Product, "id">) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    refetch: () => Promise<any>;

    // Metadata
    isAuthenticated: boolean;
    storageType: "database" | "localStorage";
}

/**
 * Unified hook that provides the same interface regardless of authentication state
 */
export function useProductsUnified(): UnifiedProductsReturn {
    const { user } = useAuth();
    const isAuthenticated = !!user;

    // Database hooks (for authenticated users)
    const databaseQuery = useProducts(user?.id || "");
    const createDatabaseProduct = useCreateProduct();
    const deleteDatabaseProduct = useDeleteProduct();

    // Local storage hooks (for unauthenticated users)
    const localQuery = useLocalProductsQuery();

    // Choose the appropriate storage based on authentication
    if (isAuthenticated) {
        // Database storage for authenticated users
        return {
            data: databaseQuery.data || [],
            isLoading: databaseQuery.isLoading,
            error: databaseQuery.error,

            addProduct: async (productData: Omit<Product, "id">) => {
                if (!user)
                    throw new Error("User not authenticated");

                await createDatabaseProduct.mutateAsync({
                    ...productData,
                    userId: user.id,
                });

                // Refetch to get updated data
                await databaseQuery.refetch();
            },

            deleteProduct: async (id: string) => {
                await deleteDatabaseProduct.mutateAsync(id);
                await databaseQuery.refetch();
            },

            refetch: databaseQuery.refetch,
            isAuthenticated: true,
            storageType: "database",
        };
    }
    else {
        // Local storage for unauthenticated users
        return {
            data: localQuery.query.data || [],
            isLoading: localQuery.query.isLoading,
            error: localQuery.query.error,

            addProduct: async (productData: Omit<Product, "id">) => {
                await localQuery.createMutation.mutateAsync(productData);
            },

            deleteProduct: async (id: string) => {
                await localQuery.deleteMutation.mutateAsync(id);
            },

            refetch: localQuery.query.refetch,
            isAuthenticated: false,
            storageType: "localStorage",
        };
    }
}

/**
 * Helper hook that provides loading states for the unified system
 */
export function useProductsUnifiedStates() {
    const { user } = useAuth();
    const isAuthenticated = !!user;

    // Get loading states from the appropriate system
    const databaseQuery = useProducts(user?.id || "");
    const createDatabaseProduct = useCreateProduct();
    const deleteDatabaseProduct = useDeleteProduct();

    const localQuery = useLocalProductsQuery();

    if (isAuthenticated) {
        return {
            isCreating: createDatabaseProduct.isPending,
            isDeleting: deleteDatabaseProduct.isPending,
            isRefetching: databaseQuery.isFetching && !databaseQuery.isLoading,
            hasError: !!databaseQuery.error,
            storageType: "database" as const,
        };
    }
    else {
        return {
            isCreating: localQuery.createMutation.isPending,
            isDeleting: localQuery.deleteMutation.isPending,
            isRefetching: false,
            hasError: false,
            storageType: "localStorage" as const,
        };
    }
}
