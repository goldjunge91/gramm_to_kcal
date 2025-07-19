import { toast } from "sonner";

import { createClient } from "@/utils/supabase/client";

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
  private batteryLevel = 1;
  private isCharging = false;
  private networkType: "wifi" | "4g" | "3g" | "slow-2g" = "4g";
  private syncTimeout: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.initMobileDetection().catch(console.error);
      this.setupEventListeners();
    }
  }

  private async initMobileDetection(): Promise<void> {
    // Network detection
    this.isOnline = navigator.onLine;

    // Battery API (mobile-specific)
    if ("getBattery" in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        this.batteryLevel = battery.level;
        this.isCharging = battery.charging;

        battery.addEventListener("levelchange", () => {
          this.batteryLevel = battery.level;
          this.adjustSyncStrategy();
        });

        battery.addEventListener("chargingchange", () => {
          this.isCharging = battery.charging;
          this.adjustSyncStrategy();
        });
      } catch {
        console.log("Battery API not available");
      }
    }

    // Network type detection (mobile-specific)
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      this.networkType = connection.effectiveType || "4g";

      connection.addEventListener("change", () => {
        this.networkType = connection.effectiveType || "4g";
        this.adjustSyncStrategy();
      });
    }
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

  private adjustSyncStrategy(): void {
    if (!this.isOnline) return;

    // Conservative sync on low battery
    if (this.batteryLevel < 0.2 && !this.isCharging) {
      this.pauseSync();
      toast.info("Sync paused - low battery", { duration: 2000 });
      return;
    }

    // Adjust sync frequency based on network type
    const syncInterval = this.getSyncInterval();
    this.scheduleMobileSync(syncInterval);
  }

  private getSyncInterval(): number {
    // Mobile-optimized sync intervals
    switch (this.networkType) {
      case "wifi":
        return 30000; // 30 seconds on WiFi
      case "4g":
        return 60000; // 1 minute on 4G
      case "3g":
        return 120000; // 2 minutes on 3G
      case "slow-2g":
        return 300000; // 5 minutes on slow connection
      default:
        return 60000;
    }
  }

  async startMobileSync(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    // Check battery and network conditions
    if (this.batteryLevel < 0.15 && !this.isCharging) {
      console.log("Sync skipped - critical battery level");
      return;
    }

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

    // Process high priority items first
    const highPriorityItems = queue
      .filter((item) => item.priority === "high")
      .slice(0, 10);

    for (const item of highPriorityItems) {
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

    // Process normal priority items if on WiFi or good connection
    if (this.networkType === "wifi" || this.networkType === "4g") {
      const normalItems = queue
        .filter((item) => item.priority === "normal")
        .slice(0, 5);

      for (const item of normalItems) {
        try {
          await this.syncItem(supabase, item);
          await mobileOfflineStorage.removeSyncQueueItem(item.id);
        } catch (error) {
          console.error(`Failed to sync ${item.table}:`, error);
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

  private scheduleMobileSync(interval: number): void {
    if (this.syncTimeout) clearTimeout(this.syncTimeout);

    this.syncTimeout = setTimeout(() => {
      this.startMobileSync().catch(console.error);
    }, interval);
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
    batteryLevel: number;
    isCharging: boolean;
    networkType: string;
    syncInProgress: boolean;
  } {
    return {
      isOnline: this.isOnline,
      batteryLevel: this.batteryLevel,
      isCharging: this.isCharging,
      networkType: this.networkType,
      syncInProgress: this.syncInProgress,
    };
  }
}

export const mobileSyncManager = new MobileSyncManager();
