import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import { mobileOfflineStorage } from "./mobile-storage";

interface SyncQueueItem {
  id: string;
  table: "products" | "recipes" | "ingredients";
  operation: "create" | "update" | "delete";
  data: any;
  timestamp: number;
  retryCount: number;
  priority: "high" | "normal" | "low";
}

export class MobileSyncManager {
  private isOnline = true;
  private syncInProgress = false;
  private syncTimeout: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.initMobileDetection();
      this.setupEventListeners();
    }
  }

  private initMobileDetection(): void {
    // Network detection
    this.isOnline = navigator.onLine;
  }

  private setupEventListeners(): void {
    window.addEventListener("online", this.handleOnline.bind(this));
    window.addEventListener("offline", this.handleOffline.bind(this));

    // Mobile-specific: Pause sync when app goes to background
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pauseSync();
      } else {
        this.resumeSync();
      }
    });

    // Mobile-specific: Handle app lifecycle
    window.addEventListener("beforeunload", () => {
      this.pauseSync();
    });
  }

  private handleOnline(): void {
    this.isOnline = true;
    toast.success("Back online - syncing data", { duration: 2000 });
    this.startMobileSync().catch(console.error);
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.pauseSync();
    toast.info("Working offline - changes will sync when online", {
      duration: 3000,
    });
  }

  private getSyncInterval(): number {
    // Simple fixed sync interval
    return 60000; // 1 minute
  }

  async startMobileSync(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      await this.processMobileSyncQueue();
      await this.syncCriticalDataOnly(); // Mobile: sync only essential data

      toast.success("Data synced", { duration: 1500 });
    } catch (error) {
      console.error("Mobile sync failed:", error);
      toast.error("Sync failed - will retry", { duration: 2000 });
      this.scheduleRetry();
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processMobileSyncQueue(): Promise<void> {
    const queue = await mobileOfflineStorage.getSyncQueue();
    const supabase = createClient();

    // Process all items up to a reasonable limit
    const itemsToSync = queue.slice(0, 15);

    for (const item of itemsToSync) {
      try {
        await this.syncItem(supabase, item);
        await mobileOfflineStorage.removeSyncQueueItem(item.id);
      } catch (error) {
        console.error(`Failed to sync ${item.table}:`, error);
        item.retryCount++;

        if (item.retryCount > 3) {
          await mobileOfflineStorage.removeSyncQueueItem(item.id);
        }
      }
    }
  }

  private async syncItem(supabase: any, item: SyncQueueItem): Promise<void> {
    switch (item.table) {
      case "products":
        await this.syncProduct(supabase, item);
        break;
      case "recipes":
        await this.syncRecipe(supabase, item);
        break;
      case "ingredients":
        await this.syncIngredient(supabase, item);
        break;
    }
  }

  private async syncProduct(supabase: any, item: SyncQueueItem): Promise<void> {
    switch (item.operation) {
      case "create":
        await supabase.from("products").insert(item.data);
        break;
      case "update":
        await supabase
          .from("products")
          .update(item.data)
          .eq("id", item.data.id);
        break;
      case "delete":
        await supabase.from("products").delete().eq("id", item.data.id);
        break;
    }
  }

  private async syncRecipe(supabase: any, item: SyncQueueItem): Promise<void> {
    switch (item.operation) {
      case "create":
        await supabase.from("recipes").insert(item.data);
        break;
      case "update":
        await supabase.from("recipes").update(item.data).eq("id", item.data.id);
        break;
      case "delete":
        await supabase.from("recipes").delete().eq("id", item.data.id);
        break;
    }
  }

  private async syncIngredient(
    supabase: any,
    item: SyncQueueItem,
  ): Promise<void> {
    switch (item.operation) {
      case "create":
        await supabase.from("ingredients").insert(item.data);
        break;
      case "update":
        await supabase
          .from("ingredients")
          .update(item.data)
          .eq("id", item.data.id);
        break;
      case "delete":
        await supabase.from("ingredients").delete().eq("id", item.data.id);
        break;
    }
  }

  private async syncCriticalDataOnly(): Promise<void> {
    // Mobile: Only sync most recent and frequently used data
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Sync only last 20 products (mobile optimization)
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (products) {
      for (const product of products) {
        await mobileOfflineStorage.saveProduct(product as any);
      }
    }

    // Sync only last 10 recipes with ingredients
    const { data: recipes } = await supabase
      .from("recipes")
      .select("*, ingredients(*)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (recipes) {
      for (const recipe of recipes) {
        await mobileOfflineStorage.saveRecipe(recipe as any);
        if (recipe.ingredients) {
          for (const ingredient of recipe.ingredients) {
            await mobileOfflineStorage.saveIngredient(ingredient as any);
          }
        }
      }
    }
  }

  private scheduleMobileSync(): void {
    if (this.syncTimeout) clearTimeout(this.syncTimeout);

    this.syncTimeout = setTimeout(() => {
      this.startMobileSync().catch(console.error);
    }, this.getSyncInterval());
  }

  private scheduleRetry(): void {
    // Exponential backoff for mobile
    const retryDelay = Math.min(60000, 5000 * 2 ** 1); // Max 1 minute

    if (this.syncTimeout) clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => {
      this.startMobileSync().catch(console.error);
    }, retryDelay);
  }

  private pauseSync(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
  }

  private resumeSync(): void {
    if (this.isOnline && !this.syncTimeout) {
      this.startMobileSync().catch(console.error);
    }
  }

  // Mobile-specific status methods
  getMobileStatus(): {
    isOnline: boolean;
    syncInProgress: boolean;
  } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
    };
  }
}

export const mobileSyncManager = new MobileSyncManager();
