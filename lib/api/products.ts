import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useMobileOffline } from "@/app/providers";
import { mobileOfflineStorage } from "@/lib/offline/mobile-storage";

import type { NewProduct, Product } from "../db/schema";

export const useProducts = (userId: string) => {
  const { isOnline } = useMobileOffline();

  return useQuery({
    queryKey: ["products", userId],
    queryFn: async (): Promise<Product[]> => {
      if (!isOnline) {
        return await mobileOfflineStorage.getProducts(userId);
      }

      // Use local API endpoint instead of Supabase
      const response = await fetch('/api/user/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache offline
      for (const product of data) {
        await mobileOfflineStorage.saveProduct(product);
      }

      return data;
    },
    enabled: !!userId,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { isOnline } = useMobileOffline();

  return useMutation({
    mutationFn: async (product: NewProduct): Promise<Product> => {
      const productWithId: Product = {
        ...product,
        id: crypto.randomUUID(),
        version: 1,
        userId: product.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: isOnline ? "synced" : "pending",
        lastSyncAt: isOnline ? new Date() : null,
        isDeleted: false,
      };

      if (!isOnline) {
        // Save offline and queue for sync
        await mobileOfflineStorage.saveProduct(productWithId);
        await mobileOfflineStorage.addToSyncQueue({
          table: "products",
          operation: "create",
          data: productWithId,
        });
        toast.success("Product saved offline");
        return productWithId;
      }

      // Use local API endpoint instead of Supabase
      const response = await fetch('/api/user/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });

      if (!response.ok) {
        throw new Error(`Failed to create product: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache offline
      await mobileOfflineStorage.saveProduct(data);
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
      const errorMsg =
        error?.message ||
        error?.error_description ||
        error?.toString() ||
        "Failed to create product";
      toast.error(errorMsg);
      console.error("Create product error:", error);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { isOnline } = useMobileOffline();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Product>;
    }): Promise<Product> => {
      const updatedProduct: Product = {
        ...updates,
        id,
        name: updates.name || "",
        quantity: updates.quantity || 0,
        kcal: updates.kcal || 0,
        userId: updates.userId || "",
        version: (updates.version || 1) + 1,
        createdAt: updates.createdAt || new Date(),
        updatedAt: new Date(),
        syncStatus: isOnline ? "synced" : "pending",
        lastSyncAt: isOnline ? new Date() : null,
        isDeleted: updates.isDeleted || false,
      };

      if (!isOnline) {
        await mobileOfflineStorage.saveProduct(updatedProduct);
        await mobileOfflineStorage.addToSyncQueue({
          table: "products",
          operation: "update",
          data: updatedProduct,
        });
        toast.success("Product updated offline");
        return updatedProduct;
      }

      // Use local API endpoint instead of Supabase
      const response = await fetch(`/api/user/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.statusText}`);
      }

      const data = await response.json();

      await mobileOfflineStorage.saveProduct(data);
      toast.success("Product updated");
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["products", data.userId],
        (old: Product[] = []) =>
          old.map((product) => (product.id === data.id ? data : product)),
      );
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { isOnline } = useMobileOffline();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!isOnline) {
        // Mark as deleted offline
        const products = await mobileOfflineStorage.getProducts("");
        const product = products.find((p) => p.id === id);
        if (product) {
          const deletedProduct = {
            ...product,
            isDeleted: true,
            syncStatus: "pending" as const,
          };
          await mobileOfflineStorage.saveProduct(deletedProduct);
          await mobileOfflineStorage.addToSyncQueue({
            table: "products",
            operation: "delete",
            data: { id },
          });
        }
        toast.success("Product deleted offline");
        return;
      }

      // Use local API endpoint instead of Supabase
      const response = await fetch(`/api/user/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.statusText}`);
      }

      toast.success("Product deleted");
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(["products"], (old: Product[] = []) =>
        old.filter((product) => product.id !== id),
      );
    },
  });
};
