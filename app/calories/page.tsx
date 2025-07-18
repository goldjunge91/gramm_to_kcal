'use client'

import { Plus, RefreshCw } from 'lucide-react'
import { useState, type JSX } from 'react'

import { useAuth, useMobileOffline } from '@/app/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useIsMobile } from '@/hooks/use-mobile'
import { useCreateProduct, useDeleteProduct, useProducts } from '@/lib/api/products'

import { ComparisonTable } from './components/ComparisonTable'
import { ProductForm } from './components/ProductForm'

export default function CaloriesPage(): JSX.Element {
  const { user } = useAuth()
  const { isOnline, syncInProgress } = useMobileOffline()
  const isMobile = useIsMobile()
  const [showForm, setShowForm] = useState(false)
  
  const { data: products = [], isLoading, refetch } = useProducts(user?.id || '')
  const createProduct = useCreateProduct()
  const deleteProduct = useDeleteProduct()

  const handleAddProduct = async (productData: Omit<Product, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version' | 'isDeleted' | 'lastSyncAt'>): Promise<void> => {
    if (!user) return
    
    await createProduct.mutateAsync({
      ...productData,
      userId: user.id,
    })
    
    // Close form on mobile after adding
    if (isMobile) {
      setShowForm(false)
    }
  }

  const handleDeleteProduct = async (id: string): Promise<void> => {
    await deleteProduct.mutateAsync(id)
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please sign in to access the calorie comparison feature.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      {/* Mobile Status - only on mobile */}
      {isMobile && <MobileOfflineStatus />}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg md:text-xl">Kalorienvergleich</CardTitle>
              <CardDescription className="text-sm">
                Vergleiche Produkte nach ihrer Kaloriendichte
                {!isOnline && ' (Offline-Modus)'}
              </CardDescription>
            </div>
            
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
            <div className={isMobile ? 'border rounded-lg p-4' : ''}>
              <ProductForm 
                onSubmit={handleAddProduct}
                isLoading={createProduct.isPending}
                compact={isMobile} // Mobile-optimized form
              />
            </div>
          )}
          
          {/* Mobile: Manual refresh button when offline */}
          {isMobile && !isOnline && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh from cache
              </Button>
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                {isOnline ? 'Loading products...' : 'Loading from offline storage...'}
              </p>
            </div>
          ) : (
            <ComparisonTable 
              products={products}
              onDelete={handleDeleteProduct}
              isDeleting={deleteProduct.isPending}
              compact={isMobile} // Mobile-optimized table
            />
          )}

          {/* Mobile: Show product count and storage info */}
          {isMobile && products.length > 0 && (
            <div className="text-center text-xs text-muted-foreground pt-2 border-t">
              {products.length} products • 
              {isOnline ? ' Synced' : ' Cached offline'}
              {syncInProgress && ' • Syncing...'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
