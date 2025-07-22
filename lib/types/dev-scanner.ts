/**
 * Enhanced types for developer scanner with detailed OpenFoodFacts data
 */

import type { Product } from '@/lib/types/types'

export interface ExtendedOpenFoodFactsProduct {
  code: string
  product: {
    // Basic product info
    product_name?: string
    product_name_de?: string
    product_name_en?: string
    generic_name?: string
    brands?: string
    brands_tags?: string[]

    // Categories and classification
    categories?: string
    categories_tags?: string[]
    categories_hierarchy?: string[]

    // Nutrition data
    nutriments?: {
      'energy-kcal_100g'?: number
      'energy-kcal'?: number
      'energy-kj_100g'?: number
      'energy-kj'?: number
      'energy_100g'?: number
      'energy'?: number
      'fat_100g'?: number
      'saturated-fat_100g'?: number
      'carbohydrates_100g'?: number
      'sugars_100g'?: number
      'proteins_100g'?: number
      'salt_100g'?: number
      'sodium_100g'?: number
      'fiber_100g'?: number
      [key: string]: number | undefined
    }

    // Physical properties
    quantity?: string
    serving_quantity?: string
    serving_size?: string
    net_weight?: string

    // Images
    image_url?: string
    image_front_url?: string
    image_nutrition_url?: string
    image_ingredients_url?: string
    selected_images?: {
      front?: {
        display?: {
          de?: string
          en?: string
        }
      }
      nutrition?: {
        display?: {
          de?: string
          en?: string
        }
      }
      ingredients?: {
        display?: {
          de?: string
          en?: string
        }
      }
    }

    // Ingredients and allergens
    ingredients?: Array<{
      id: string
      text: string
      rank?: number
    }>
    ingredients_text?: string
    ingredients_text_de?: string
    ingredients_text_en?: string
    allergens?: string
    allergens_tags?: string[]
    traces?: string
    traces_tags?: string[]

    // Quality and completeness
    completeness?: number
    data_quality_tags?: string[]
    nutrition_data_per?: string
    nutrition_data_prepared?: string

    // Additional metadata
    countries?: string
    countries_tags?: string[]
    manufacturing_places?: string
    origins?: string
    labels?: string
    labels_tags?: string[]
    packaging?: string
    packaging_tags?: string[]

    // Timestamps
    created_datetime?: string
    last_modified_datetime?: string
    last_image_datetime?: string
  }
  status: number
  status_verbose: string
}

export interface EnhancedProductLookupResult {
  success: boolean
  product?: Omit<Product, 'id'>
  enhancedData?: {
    openFoodFacts: ExtendedOpenFoodFactsProduct
    nutritionScore?: string
    completenessScore?: number
    images: ProductImages
    categories: string[]
    allergens: string[]
    ingredients: string[]
  }
  error?: string
  source?: 'openfoodfacts'
  metadata: {
    requestTime: number
    responseTime: number
    barcode: string
    apiUrl: string
    userAgent: string
  }
  validation: BarcodeValidation
}

export interface ProductImages {
  front?: string
  nutrition?: string
  ingredients?: string
  packaging?: string[]
}

export interface BarcodeValidation {
  isValid: boolean
  format: 'EAN13' | 'EAN8' | 'UPC' | 'CODE128' | 'UNKNOWN'
  checksum: boolean
  length: number
  errors: string[]
}

export interface ScanDiagnostics {
  scanId: string
  timestamp: string
  scanMode: 'camera' | 'upload'
  barcode: string
  scanDuration: number
  lookupDuration: number
  success: boolean
  error?: string
  deviceInfo?: {
    userAgent: string
    platform: string
    isMobile: boolean
    hasCamera: boolean
    cameraCount: number
  }
  scannerSettings?: {
    fps: number
    qrbox: { width: number, height: number }
    aspectRatio: number
  }
}

export interface DevScannerStats {
  totalScans: number
  successfulScans: number
  failedScans: number
  averageResponseTime: number
  averageScanTime: number
  topBrands: Array<{ brand: string, count: number }>
  topCategories: Array<{ category: string, count: number }>
  recentScans: ScanDiagnostics[]
}

export interface TestBarcode {
  barcode: string
  name: string
  description: string
  expectedResult: 'success' | 'failure' | 'no-nutrition'
  category: string
  notes?: string
}

export interface DevScannerSession {
  sessionId: string
  startTime: string
  scans: ScanDiagnostics[]
  stats: DevScannerStats
}
