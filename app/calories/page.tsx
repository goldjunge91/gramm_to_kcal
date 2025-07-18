"use client";

import { useState, JSX } from "react";
import { Product } from "@/lib/types";
import { ProductForm } from "./components/ProductForm";
import { ComparisonTable } from "./components/ComparisonTable";

/** Calorie comparison page for analyzing product nutrition */
export default function CaloriesPage(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);

  const handleAddProduct = (productData: Omit<Product, "id">): void => {
    const id = `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newProduct = { id, ...productData };
    setProducts(prevProducts => [...prevProducts, newProduct]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Kalorienvergleich</h1>
        <p className="text-muted-foreground">
          Vergleiche Produkte basierend auf ihren Kalorien pro 100g
        </p>
      </div>
      
      <ProductForm onAddProduct={handleAddProduct} />
      <ComparisonTable products={products} />
    </div>
  );
}