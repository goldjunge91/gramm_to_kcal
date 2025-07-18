"use client";

import type { User } from "@supabase/supabase-js";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type JSX,
  type ReactNode,
} from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import { syncUserWithDatabase } from "@/lib/actions/auth";
import { mobileOfflineStorage } from "@/lib/offline/mobile-storage";
import { mobileSyncManager } from "@/lib/offline/mobile-sync-manager";
import { createClient } from "@/lib/supabase/client";

// Mobile-optimized Query Client
const createMobileQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10 * 60 * 1000, // 10 minutes (longer for mobile)
        gcTime: 30 * 60 * 1000, // 30 minutes cache
        retry: (failureCount) => {
          if (!navigator.onLine) return false;
          // Less aggressive retries on mobile
          return failureCount < 2;
        },
        refetchOnWindowFocus: false, // Disable for mobile battery saving
        refetchOnReconnect: true, // Important for mobile
        networkMode: "offlineFirst", // Mobile-first approach
      },
      mutations: {
        retry: (failureCount) => {
          if (!navigator.onLine) return false;
          return failureCount < 1; // Single retry on mobile
        },
        networkMode: "offlineFirst",
      },
    },
  });

const queryClient = createMobileQueryClient();

// Auth Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Enhanced Mobile Context
interface MobileOfflineContextType {
  isOnline: boolean;
  syncInProgress: boolean;
  lastSyncAt: Date | null;
  batteryLevel: number;
  isCharging: boolean;
  networkType: string;
  storageUsed: number;
  maxStorage: number;
}

const MobileOfflineContext = createContext<
  MobileOfflineContextType | undefined
>(undefined);

export function Providers({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  // Mobile-specific state
  const [mobileStatus, setMobileStatus] = useState({
    isOnline: true,
    syncInProgress: false,
    lastSyncAt: null as Date | null,
    batteryLevel: 1,
    isCharging: false,
    networkType: "4g",
    storageUsed: 0,
    maxStorage: 50 * 1024 * 1024, // 50MB
  });

  useEffect(() => {
    const supabase = createClient();

    // Initialize mobile storage
    mobileOfflineStorage.init().catch(console.error);

    // Get initial session
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          // Sync user with database
          try {
            await syncUserWithDatabase(session.user.id);
          } catch (error) {
            console.error("Error syncing user with database:", error);
          }
        }
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch(console.error);

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Sync user with database on auth state change
        try {
          await syncUserWithDatabase(session.user.id);
        } catch (error) {
          console.error("Error syncing user with database:", error);
        }
      }
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Mobile-specific status monitoring
    const updateMobileStatus = (): void => {
      const status = mobileSyncManager.getMobileStatus();
      setMobileStatus((prev) => ({
        ...prev,
        ...status,
        lastSyncAt: prev.lastSyncAt, // Preserve last sync time
      }));
    };

    // Update mobile status every 30 seconds
    const statusInterval = setInterval(updateMobileStatus, 30000);
    updateMobileStatus(); // Initial update

    // Mobile-specific event listeners
    const handleOnline = (): void => {
      setMobileStatus((prev) => ({ ...prev, isOnline: true }));
      mobileSyncManager
        .startMobileSync()
        .then(() => {
          setMobileStatus((prev) => ({ ...prev, lastSyncAt: new Date() }));
        })
        .catch(console.error);
    };

    const handleOffline = (): void => {
      setMobileStatus((prev) => ({ ...prev, isOnline: false }));
    };

    // Mobile app lifecycle events
    const handleVisibilityChange = (): void => {
      if (!document.hidden && navigator.onLine) {
        // App came to foreground and online - sync
        mobileSyncManager.startMobileSync().catch(console.error);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      subscription.unsubscribe();
      clearInterval(statusInterval);
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      }
    };
  }, []);

  const signOut = async (): Promise<void> => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user, loading, signOut }}>
        <MobileOfflineContext.Provider value={mobileStatus}>
          {children}
          {/* Only show dev tools on desktop */}
          {!isMobile && <ReactQueryDevtools initialIsOpen={false} />}
        </MobileOfflineContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useMobileOffline = (): MobileOfflineContextType => {
  const context = useContext(MobileOfflineContext);
  if (context === undefined) {
    throw new Error(
      "useMobileOffline must be used within a MobileOfflineProvider",
    );
  }
  return context;
};
