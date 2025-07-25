"use client";

import { Plus, RefreshCw, Scan } from "lucide-react";
import Link from "next/link";
import { useState, type JSX } from "react";

import type { Product } from "@/lib/types/types";

import { useMobileOffline } from "@/app/providers";
// import { MobileOfflineStatus } from "@/components/MobileOfflineStatus";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useProductsUnified,
  useProductsUnifiedStates,
} from "@/hooks/use-products-unified";

import { ComparisonTable } from "./components/ComparisonTable";
import { ProductForm } from "./components/ProductForm";

export default function CaloriesPage(): JSX.Element {
  const { isOnline, syncInProgress } = useMobileOffline();
  const isMobile = useIsMobile();
  const [showForm, setShowForm] = useState(false);

  const {
    data: products = [],
    isLoading,
    addProduct,
    deleteProduct,
    refetch,
    isAuthenticated,
    storageType,
  } = useProductsUnified();

  const { isCreating, isDeleting } = useProductsUnifiedStates();

  const handleAddProduct = async (
    productData: Omit<Product, "id">,
  ): Promise<void> => {
    await addProduct(productData);

    // Close form on mobile after adding
    if (isMobile) {
      setShowForm(false);
    }
  };

  const handleDeleteProduct = async (id: string): Promise<void> => {
    await deleteProduct(id);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      {/* Mobile Status - only on mobile */}
      {/* {isMobile && <MobileOfflineStatus />} */}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg md:text-xl">
                Kalorienvergleich
              </CardTitle>
              <CardDescription className="text-sm">
                Vergleiche Produkte nach ihrer Kaloriendichte
                {!isAuthenticated && " (Temporäre Sitzung)"}
                {isAuthenticated && !isOnline && " (Offline-Modus)"}
              </CardDescription>
            </div>

            {/* Beta Link to Barcode Scanner */}
            {!isMobile && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/calories-scan" className="flex items-center gap-2">
                  <Scan className="h-4 w-4" />
                  Barcode Scanner (Beta)
                </Link>
              </Button>
            )}

            {/* Mobile: Floating Add Button */}
            {isMobile && (
              <Button
                onClick={() => setShowForm(!showForm)}
                size="sm"
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Desktop: Always show form, Mobile: Toggle */}
          {(!isMobile || showForm) && (
            <div className={isMobile ? "border rounded-lg p-4" : ""}>
              <ProductForm
                onSubmit={handleAddProduct}
                isLoading={isCreating}
                compact={isMobile} // Mobile-optimized form
              />
            </div>
          )}

          {/* Mobile: Manual refresh button when offline (only for authenticated users) */}
          {isMobile && isAuthenticated && !isOnline && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh from cache
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                {storageType === "localStorage"
                  ? "Loading from session storage..."
                  : isOnline
                    ? "Loading products..."
                    : "Loading from offline storage..."}
              </p>
            </div>
          ) : (
            <ComparisonTable
              products={products}
              onDelete={handleDeleteProduct}
              isDeleting={isDeleting}
              compact={isMobile} // Mobile-optimized table
            />
          )}

          {/* Mobile: Show product count and storage info */}
          {isMobile && products.length > 0 && (
            <div className="text-center text-xs text-muted-foreground pt-2 border-t">
              {products.length} products •
              {storageType === "localStorage"
                ? " Session only"
                : isOnline
                  ? " Synced"
                  : " Cached offline"}
              {isAuthenticated && syncInProgress && " • Syncing..."}
            </div>
          )}

          {/* Mobile: Beta Link to Barcode Scanner */}
          {isMobile && (
            <div className="text-center pt-4">
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link
                  href="/calories-scan"
                  className="flex items-center justify-center gap-2"
                >
                  <Scan className="h-4 w-4" />
                  Barcode Scanner (Beta) ausprobieren
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
