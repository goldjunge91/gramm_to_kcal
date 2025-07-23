import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { NewProduct, Product } from "../db/schemas";

// Pagination response type
interface ProductsResponse {
    products: Product[];
    pagination: {
        limit: number;
        cursor: string | null;
        nextCursor: string | null;
        hasMore: boolean;
        count: number;
    };
}

export function useProducts(userId: string, cursor?: string, limit = 20) {
    return useQuery({
        queryKey: ["products", userId, cursor, limit],
        queryFn: async (): Promise<ProductsResponse> => {
            const params = new URLSearchParams();
            if (cursor)
                params.set("cursor", cursor);
            params.set("limit", limit.toString());

            const response = await fetch(`/api/user/products?${params}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch products: ${response.statusText}`,
                );
            }

            return await response.json();
        },
        enabled: !!userId,
    });
}

// Backward compatible hook that returns just the products array
export function useProductsList(userId: string) {
    const query = useProducts(userId);
    return {
        ...query,
        data: query.data?.products || [],
    };
}

export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (product: NewProduct): Promise<Product> => {
            const response = await fetch("/api/user/products", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(product),
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to create product: ${response.statusText}`,
                );
            }

            const data = await response.json();
            toast.success("Product created");
            return data;
        },
        onSuccess: (data) => {
            // Invalidate all products queries for this user to refresh pagination
            queryClient.invalidateQueries({
                queryKey: ["products", data.userId],
            });
        },
        onError: (error: any) => {
            const errorMsg
                = error?.message
                    || error?.error_description
                    || error?.toString()
                    || "Failed to create product";
            toast.error(errorMsg);
            console.error("Create product error:", error);
        },
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            updates,
        }: {
            id: string;
            updates: Partial<Product>;
        }): Promise<Product> => {
            const response = await fetch(`/api/user/products/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to update product: ${response.statusText}`,
                );
            }

            const data = await response.json();
            toast.success("Product updated");
            return data;
        },
        onSuccess: (data) => {
            // Invalidate all products queries for this user to refresh pagination
            queryClient.invalidateQueries({
                queryKey: ["products", data.userId],
            });
        },
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string): Promise<void> => {
            const response = await fetch(`/api/user/products/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to delete product: ${response.statusText}`,
                );
            }

            toast.success("Product deleted");
        },
        onSuccess: () => {
            // Invalidate all products queries to refresh pagination
            queryClient.invalidateQueries({
                queryKey: ["products"],
            });
        },
    });
}
