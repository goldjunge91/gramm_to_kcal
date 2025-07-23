import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { NewProduct, Product } from "../db/schemas";

export function useProducts(userId: string) {
    return useQuery({
        queryKey: ["products", userId],
        queryFn: async (): Promise<Product[]> => {
            const response = await fetch("/api/user/products", {
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
            queryClient.setQueryData(
                ["products", data.userId],
                (old: Product[] = []) => [data, ...old],
            );
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
            queryClient.setQueryData(
                ["products", data.userId],
                (old: Product[] = []) =>
                    old.map(product =>
                        product.id === data.id ? data : product,
                    ),
            );
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
        onSuccess: (_, id) => {
            queryClient.setQueryData(["products"], (old: Product[] = []) =>
                old.filter(product => product.id !== id));
        },
    });
}
