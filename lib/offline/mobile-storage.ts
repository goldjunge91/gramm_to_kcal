import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { Ingredient, Product, Recipe } from "@/lib/db/schema";

interface MobileOfflineDB extends DBSchema {
  products: {
    key: string;
    value: Product & {
      localId?: string;
      lastUsed: number; // For LRU cache management
      size: number; // Estimate storage size
    };
    indexes: {
      lastUsed: number;
      userId: string;
    };
  };
  recipes: {
    key: string;
    value: Recipe & {
      localId?: string;
      lastUsed: number;
      ingredientCount: number;
    };
    indexes: {
      lastUsed: number;
      userId: string;
    };
  };
  ingredients: {
    key: string;
    value: Ingredient & { localId?: string };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      table: "products" | "recipes" | "ingredients";
      operation: "create" | "update" | "delete";
      data: any;
      timestamp: number;
      retryCount: number;
      priority: "high" | "normal" | "low"; // Mobile battery consideration
    };
    indexes: {
      priority: "high" | "normal" | "low";
      timestamp: number;
    };
  };
  appState: {
    key: string;
    value: {
      lastSync: number;
      storageUsed: number;
      maxStorage: number;
      networkType: "wifi" | "4g" | "3g" | "slow-2g";
    };
  };
}

class MobileOfflineStorage {
  private db: IDBPDatabase<MobileOfflineDB> | null = null;
  private readonly MAX_STORAGE_MB = 50; // Conservative for mobile
  private readonly MAX_PRODUCTS = 500; // Limit for performance
  private readonly MAX_RECIPES = 100;

  async init(): Promise<void> {
    this.db = await openDB<MobileOfflineDB>("calorie-tracker-mobile", 1, {
      upgrade(db: IDBPDatabase<MobileOfflineDB>) {
        // Products with mobile-optimized indexes
        const productsStore = db.createObjectStore("products", {
          keyPath: "id",
        });
        productsStore.createIndex("lastUsed", "lastUsed");
        productsStore.createIndex("userId", "userId");

        // Recipes with ingredient count for quick loading
        const recipesStore = db.createObjectStore("recipes", { keyPath: "id" });
        recipesStore.createIndex("lastUsed", "lastUsed");
        recipesStore.createIndex("userId", "userId");

        db.createObjectStore("ingredients", { keyPath: "id" });

        // Priority-based sync queue for mobile
        const syncStore = db.createObjectStore("syncQueue", { keyPath: "id" });
        syncStore.createIndex("priority", "priority");
        syncStore.createIndex("timestamp", "timestamp");

        db.createObjectStore("appState", { keyPath: "key" });
      },
    });

    // Initialize app state
    await this.updateAppState({
      lastSync: 0,
      storageUsed: 0,
      maxStorage: this.MAX_STORAGE_MB * 1024 * 1024,
      networkType: this.detectNetworkType(),
    });
  }

  private detectNetworkType(): "wifi" | "4g" | "3g" | "slow-2g" {
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        return effectiveType || "4g";
      }
    }
    return "4g";
  }

  async getProducts(userId: string, limit = 50): Promise<Product[]> {
    if (!this.db) await this.init();

    // Get most recently used products first (mobile UX)
    const tx = this.db!.transaction("products", "readonly");
    const index = tx.store.index("lastUsed");
    const products = await index.getAll();

    return products
      .filter(
        (p: Product & { lastUsed: number }) =>
          p.userId === userId && !p.isDeleted,
      )
      .sort(
        (a: { lastUsed: number }, b: { lastUsed: number }) =>
          b.lastUsed - a.lastUsed,
      )
      .slice(0, limit);
  }

  async saveProduct(product: Product): Promise<void> {
    if (!this.db) await this.init();

    // Add mobile-specific metadata
    const mobileProduct = {
      ...product,
      lastUsed: Date.now(),
      size: JSON.stringify(product).length,
    };

    await this.db!.put("products", mobileProduct);
    await this.cleanupIfNeeded();
  }

  async saveRecipe(recipe: Recipe): Promise<void> {
    if (!this.db) await this.init();

    const mobileRecipe = {
      ...recipe,
      lastUsed: Date.now(),
      ingredientCount: 0, // Recipe doesn't have ingredients array in schema
    };

    await this.db!.put("recipes", mobileRecipe);
    await this.cleanupIfNeeded();
  }

  async saveIngredient(ingredient: Ingredient): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put("ingredients", ingredient);
  }

  // Mobile-specific: Clean up old data when storage is full
  private async cleanupIfNeeded(): Promise<void> {
    const state = await this.getAppState();
    if (!state) return;

    const currentUsage = await this.calculateStorageUsage();

    if (currentUsage > state.maxStorage * 0.8) {
      // 80% threshold
      await this.performCleanup();
    }
  }

  private async performCleanup(): Promise<void> {
    if (!this.db) return;

    // Remove least recently used products
    const tx = this.db.transaction("products", "readwrite");
    const index = tx.store.index("lastUsed");
    const products = await index.getAll();

    // Keep only most recent products up to MAX_PRODUCTS
    const sortedProducts = products.sort(
      (a: { lastUsed: number }, b: { lastUsed: number }) =>
        b.lastUsed - a.lastUsed,
    );
    const toDelete = sortedProducts.slice(this.MAX_PRODUCTS);

    for (const product of toDelete) {
      await tx.store.delete(product.id);
    }

    // Also cleanup recipes if needed
    const recipesTx = this.db.transaction("recipes", "readwrite");
    const recipesIndex = recipesTx.store.index("lastUsed");
    const recipes = await recipesIndex.getAll();

    if (recipes.length > this.MAX_RECIPES) {
      const sortedRecipes = recipes.sort(
        (a: { lastUsed: number }, b: { lastUsed: number }) =>
          b.lastUsed - a.lastUsed,
      );
      const recipesToDelete = sortedRecipes.slice(this.MAX_RECIPES);

      for (const recipe of recipesToDelete) {
        await recipesTx.store.delete(recipe.id);
      }
    }
  }

  private async calculateStorageUsage(): Promise<number> {
    if (!this.db) return 0;

    let totalSize = 0;
    const stores = ["products", "recipes", "ingredients", "syncQueue"];

    for (const storeName of stores) {
      const tx = this.db.transaction(storeName as any, "readonly");
      const items = await tx.store.getAll();
      totalSize += items.reduce(
        (sum: number, item: any) => sum + JSON.stringify(item).length,
        0,
      );
    }

    return totalSize;
  }

  async addToSyncQueue(
    operation: any,
    priority: "high" | "normal" | "low" = "normal",
  ): Promise<void> {
    if (!this.db) await this.init();

    await this.db!.put("syncQueue", {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
      priority,
    });
  }

  // Mobile-optimized: Get sync queue by priority
  async getSyncQueue(): Promise<any[]> {
    if (!this.db) await this.init();

    const tx = this.db!.transaction("syncQueue", "readonly");
    const index = tx.store.index("priority");

    // Get high priority items first
    const highPriority = await index.getAll(IDBKeyRange.only("high"));
    const normalPriority = await index.getAll(IDBKeyRange.only("normal"));
    const lowPriority = await index.getAll(IDBKeyRange.only("low"));

    return [...highPriority, ...normalPriority, ...lowPriority];
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete("syncQueue", id);
  }

  private async updateAppState(state: any): Promise<void> {
    if (!this.db) return;
    await this.db.put("appState", { key: "main", ...state });
  }

  private async getAppState(): Promise<any> {
    if (!this.db) return null;
    return await this.db.get("appState", "main");
  }
}

export const mobileOfflineStorage = new MobileOfflineStorage();
