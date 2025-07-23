"use client";

import type { JSX } from "react";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { Ingredient } from "@/lib/types/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { scaleRecipe } from "@/lib/calculations";

import { IngredientList } from "./components/IngredientList";
import { PortionControls } from "./components/PortionControls";

/** Recipe management page for scaling recipes and adjusting ingredients */
export default function RecipePage(): JSX.Element {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [originalPortions, setOriginalPortions] = useState<number>(1);
    const [desiredPortions, setDesiredPortions] = useState<number>(1);

    // Form state for adding ingredients
    const [name, setName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("g");
    const [isCustomUnit, setIsCustomUnit] = useState(false);
    const [customUnit, setCustomUnit] = useState("");

    // Common units for the dropdown
    const commonUnits = [
        "g",
        "ml",
        "TL",
        "EL",
        "Stk",
        "Prise",
        "Tasse",
        "L",
        "kg",
    ];

    // Calculate scaled ingredients
    const scaledIngredients = useMemo(
        () => scaleRecipe(ingredients, originalPortions, desiredPortions),
        [ingredients, originalPortions, desiredPortions],
    );

    const handleAddIngredient = (event: React.FormEvent): void => {
        event.preventDefault();

        const quantityNum = Number.parseFloat(quantity);
        const finalUnit = isCustomUnit ? customUnit.trim() : unit;

        if (!name.trim() || !quantityNum || quantityNum <= 0 || !finalUnit) {
            return;
        }

        const newIngredient: Ingredient = {
            id: `ingredient-${ingredients.length + 1}-${name.trim().replaceAll(/\s/g, "").toLowerCase()}`,
            name: name.trim(),
            quantity: quantityNum,
            unit: finalUnit,
        };

        setIngredients(prev => [...prev, newIngredient]);
        toast.success("Zutat hinzugefügt");

        // Reset form
        setName("");
        setQuantity("");
        setUnit("g");
        setIsCustomUnit(false);
        setCustomUnit("");
    };

    const handleUnitChange = (value: string): void => {
        if (value === "custom") {
            setIsCustomUnit(true);
            setCustomUnit("");
        }
        else {
            setIsCustomUnit(false);
            setUnit(value);
        }
    };

    const handleDeleteIngredient = (id: string): void => {
        setIngredients(prev =>
            prev.filter(ingredient => ingredient.id !== id),
        );
    };

    const handleScaleFactorChange = (scaleFactor: number): void => {
        const newDesiredPortions = originalPortions * scaleFactor;
        setDesiredPortions(newDesiredPortions);
        toast.info("Skalierungsfaktor angepasst");
    };

    const handleQuantityChange = (id: string, newQuantity: number): void => {
        // Update the individual ingredient quantity without affecting the portion calculator
        setIngredients(prevIngredients =>
            prevIngredients.map(ingredient =>
                ingredient.id === id
                    ? { ...ingredient, quantity: newQuantity }
                    : ingredient,
            ),
        );
        toast.success("Zutat-Menge angepasst");
    };

    const handleIngredientScaleFactorChange = (
        id: string,
        newScaleFactor: number,
    ): void => {
        // Update the ingredient quantity based on the new scale factor applied to the original quantity
        setIngredients(prevIngredients =>
            prevIngredients.map((ingredient) => {
                if (ingredient.id === id) {
                    // Find the original ingredient to get the base quantity
                    const originalIngredient = prevIngredients.find(
                        orig => orig.id === id,
                    );
                    if (originalIngredient) {
                        const newQuantity
                            = originalIngredient.quantity * newScaleFactor;
                        return { ...ingredient, quantity: newQuantity };
                    }
                }
                return ingredient;
            }),
        );
        toast.success("Skalierungsfaktor angepasst");
    };

    const handleReorder = (newOrder: Ingredient[]): void => {
        // Update the ingredients order
        setIngredients(newOrder);
        toast.success("Reihenfolge der Zutaten geändert");
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Rezept-Manager</h1>
                <p className="text-muted-foreground">
                    Skaliere Rezepte und passe Zutatenmengen dynamisch an
                </p>
            </div>

            {/* Ingredient Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Neue Zutat hinzufügen</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddIngredient} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                                <Label htmlFor="ingredient-name">Zutat</Label>
                                <Input
                                    id="ingredient-name"
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="z.B. Mehl"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ingredient-quantity">
                                    Menge
                                </Label>
                                <Input
                                    id="ingredient-quantity"
                                    type="number"
                                    inputMode="decimal"
                                    value={quantity}
                                    onChange={e =>
                                        setQuantity(e.target.value)}
                                    placeholder="z.B. 500"
                                    min="0.1"
                                    step="0.1"
                                    required
                                    className="text-center"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ingredient-unit">Einheit</Label>
                                {isCustomUnit ? (
                                    <Input
                                        id="ingredient-unit"
                                        type="text"
                                        value={customUnit}
                                        onChange={e =>
                                            setCustomUnit(e.target.value)}
                                        placeholder="Eigene Einheit eingeben"
                                        required
                                    />
                                ) : (
                                    <Select
                                        value={unit}
                                        onValueChange={handleUnitChange}
                                    >
                                        <SelectTrigger id="ingredient-unit">
                                            <SelectValue placeholder="Einheit auswählen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {commonUnits.map(unitOption => (
                                                <SelectItem
                                                    key={unitOption}
                                                    value={unitOption}
                                                >
                                                    {unitOption}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="custom">
                                                Eigene Einheit...
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                                {isCustomUnit && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setIsCustomUnit(false);
                                            setCustomUnit("");
                                        }}
                                    >
                                        Zurück zur Auswahl
                                    </Button>
                                )}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full sm:w-auto"
                            aria-label="Zutat zur Rezeptliste hinzufügen"
                        >
                            Zutat hinzufügen
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Portion Controls */}
            <PortionControls
                originalPortions={originalPortions}
                desiredPortions={desiredPortions}
                onOriginalPortionsChange={(value) => {
                    setOriginalPortions(value);
                    if (value !== originalPortions) {
                        toast.info("Rezept neu berechnet");
                    }
                }}
                onDesiredPortionsChange={(value) => {
                    setDesiredPortions(value);
                    if (value !== desiredPortions) {
                        toast.info("Rezept neu berechnet");
                    }
                }}
                onScaleFactorChange={handleScaleFactorChange}
            />

            {/* Ingredient List */}
            <IngredientList
                ingredients={scaledIngredients}
                originalIngredients={ingredients}
                onDelete={handleDeleteIngredient}
                onQuantityChange={handleQuantityChange}
                onScaleFactorChange={handleIngredientScaleFactorChange}
                onReorder={handleReorder}
            />
        </div>
    );
}
