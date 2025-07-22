/**
 * Hook for managing recent barcode scans for authenticated users
 * Stores recent scans in localStorage with user prefix for quick access
 */

import { useCallback, useEffect, useState } from "react";

import type { Product } from "@/lib/types/types";

import { useAuth } from "@/app/providers";
import { env } from "@/lib/env";
import { MAX_RECENT_SCANS } from "@/server/config";

export interface RecentScan {
    id: string;
    productName: string;
    barcode?: string;
    quantity: number;
    kcal: number;
    scannedAt: string;
}

const RECENT_SCANS_KEY = env.RECENT_SCANS_KEY!;
// const MAX_RECENT_SCANS = 20;

/**
 * Generate storage key with user prefix
 */
function getStorageKey(userId: string): string {
    return `${RECENT_SCANS_KEY}-${userId}`;
}

/**
 * Hook for managing recent scans for authenticated users
 */
export function useRecentScans() {
    const { user } = useAuth();
    const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Only work with authenticated users
    const isAuthenticated = !!user;
    const storageKey = user ? getStorageKey(user.id) : null;

    // Load recent scans from localStorage on mount
    useEffect(() => {
        if (!isAuthenticated || !storageKey) {
            setIsLoading(false);
            return;
        }

        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsedScans = JSON.parse(stored) as RecentScan[];
                // Sort by most recent first
                const sortedScans = parsedScans.sort(
                    (a, b) =>
                        new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime(),
                );
                setRecentScans(sortedScans);
            }
        }
        catch (error) {
            console.warn("Failed to load recent scans from localStorage:", error);
            setRecentScans([]);
        }
        finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, storageKey]);

    // Save recent scans to localStorage
    const saveToStorage = useCallback(
        (scans: RecentScan[]) => {
            if (!storageKey)
                return;

            try {
                // Limit to MAX_RECENT_SCANS and sort by most recent
                const limitedScans = scans
                    .sort(
                        (a, b) =>
                            new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime(),
                    )
                    .slice(0, MAX_RECENT_SCANS);

                localStorage.setItem(storageKey, JSON.stringify(limitedScans));
                setRecentScans(limitedScans);
            }
            catch (error) {
                console.error("Failed to save recent scans to localStorage:", error);
            }
        },
        [storageKey],
    );

    // Add a new recent scan
    const addRecentScan = useCallback(
        (productData: Omit<Product, "id">, barcode?: string) => {
            if (!isAuthenticated)
                return;

            const newScan: RecentScan = {
                id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
                productName: productData.name,
                barcode,
                quantity: productData.quantity,
                kcal: productData.kcal,
                scannedAt: new Date().toISOString(),
            };

            // Remove any existing scan with the same product name to avoid duplicates
            const filteredScans = recentScans.filter(
                scan =>
                    scan.productName.toLowerCase() !== productData.name.toLowerCase(),
            );

            const updatedScans = [newScan, ...filteredScans];
            saveToStorage(updatedScans);
        },
        [isAuthenticated, recentScans, saveToStorage],
    );

    // Remove a recent scan
    const removeRecentScan = useCallback(
        (scanId: string) => {
            const updatedScans = recentScans.filter(scan => scan.id !== scanId);
            saveToStorage(updatedScans);
        },
        [recentScans, saveToStorage],
    );

    // Clear all recent scans
    const clearRecentScans = useCallback(() => {
        if (!storageKey)
            return;

        try {
            localStorage.removeItem(storageKey);
            setRecentScans([]);
        }
        catch (error) {
            console.error("Failed to clear recent scans from localStorage:", error);
        }
    }, [storageKey]);

    // Get recent scans as Product format for easy form population
    const getRecentScansAsProducts = useCallback((): (Product & {
        barcode?: string;
    })[] => {
        return recentScans.map(scan => ({
            id: scan.id,
            name: scan.productName,
            quantity: scan.quantity,
            kcal: scan.kcal,
            barcode: scan.barcode,
        }));
    }, [recentScans]);

    // Search recent scans by product name
    const searchRecentScans = useCallback(
        (query: string): RecentScan[] => {
            if (!query.trim())
                return recentScans;

            const lowercaseQuery = query.toLowerCase();
            return recentScans.filter(scan =>
                scan.productName.toLowerCase().includes(lowercaseQuery),
            );
        },
        [recentScans],
    );

    return {
    // Data
        recentScans,
        isLoading,
        isAuthenticated,

        // Actions
        addRecentScan,
        removeRecentScan,
        clearRecentScans,

        // Utils
        getRecentScansAsProducts,
        searchRecentScans,
        count: recentScans.length,
    };
}
