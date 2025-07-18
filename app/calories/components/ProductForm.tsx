"use client";

import { useState, type JSX } from "react";

import type { Product } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProductFormProps {
  onSubmit: (
    product: Omit<
      Product,
      | "id"
      | "userId"
      | "createdAt"
      | "updatedAt"
      | "syncStatus"
      | "version"
      | "isDeleted"
      | "lastSyncAt"
    >,
  ) => Promise<void>;
  isLoading?: boolean;
  compact?: boolean;
}

/** Form component for adding new products to compare */
export const ProductForm = ({
  onSubmit,
  isLoading = false,
  compact = false,
}: ProductFormProps): JSX.Element => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [kcal, setKcal] = useState("");

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    const quantityNum = Number.parseFloat(quantity);
    const kcalNum = Number.parseFloat(kcal);

    if (
      !name.trim() ||
      !quantityNum ||
      quantityNum <= 0 ||
      !kcalNum ||
      kcalNum <= 0
    ) {
      return;
    }

    await onSubmit({
      name: name.trim(),
      quantity: quantityNum,
      kcal: kcalNum,
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
          <div
            className={`grid gap-4 ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"}`}
          >
            <div
              className={`space-y-2 ${compact ? "" : "sm:col-span-2 md:col-span-1"}`}
            >
              <Label htmlFor="name">Produktname</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Vollkornbrot"
                required
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full sm:w-auto"
            aria-label="Produkt zur Vergleichstabelle hinzufügen"
            disabled={isLoading}
          >
            {isLoading ? "Wird hinzugefügt..." : "Hinzufügen"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
