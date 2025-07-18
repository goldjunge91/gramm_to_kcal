import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { NewProduct, Product } from "@/lib/db/schema";

import { useMobileOffline } from "@/app/providers";
import { mobileOfflineStorage } from "@/lib/offline/mobile-storage";
import { createClient } from "@/lib/supabase/client";

export const useProducts = (userId: string) => {
  const { isOnline } = useMobileOffline();

  return useQuery({
    queryKey: ["products", userId],
    queryFn: async (): Promise<Product[]> => {
      if (!isOnline) {
        return await mobileOfflineStorage.getProducts(userId);
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

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

      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .insert(product)
        .select()
        .single();

      if (error) throw error;

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
    onError: (error) => {
      toast.error("Failed to create product");
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

      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

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

      const supabase = createClient();
      const { error } = await supabase
        .from("products")
        .update({ is_deleted: true })
        .eq("id", id);

      if (error) throw error;
      toast.success("Product deleted");
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(["products"], (old: Product[] = []) =>
        old.filter((product) => product.id !== id),
      );
    },
  });
};
