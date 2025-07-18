"use client";

import { useState, type JSX } from "react";

import type { Product } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProductFormProps {
  onAddProduct: (product: Omit<Product, "id">) => void;
}

/** Form component for adding new products to compare */
export const ProductForm = ({ onAddProduct }: ProductFormProps): JSX.Element => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [kcal, setKcal] = useState("");

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    
    const quantityNum = Number.parseFloat(quantity);
    const kcalNum = Number.parseFloat(kcal);
    
    if (!name.trim() || !quantityNum || quantityNum <= 0 || !kcalNum || kcalNum <= 0) {
      return;
    }
    
    onAddProduct({
      name: name.trim(),
      quantity: quantityNum,
      kcal: kcalNum
    });
    
    // Reset form
    setName("");
    setQuantity("");
    setKcal("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neues Produkt hinzufügen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2 sm:col-span-2 md:col-span-1">
              <Label htmlFor="name">Produktname</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Vollkornbrot"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Menge (g)</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="z.B. 100"
                min="0"
                step="0.1"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="kcal">Kalorien (kcal)</Label>
              <Input
                id="kcal"
                type="number"
                value={kcal}
                onChange={(e) => setKcal(e.target.value)}
                placeholder="z.B. 250"
                min="0"
                step="0.1"
                required
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full sm:w-auto" aria-label="Produkt zur Vergleichstabelle hinzufügen">
            Hinzufügen
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};