import { Ingredient } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { JSX } from "react";

interface IngredientListProps {
  ingredients: Ingredient[];
  onDelete: (id: string) => void;
  onQuantityChange?: (id: string, newQuantity: number) => void;
}

/** Table component for displaying and managing recipe ingredients */
export const IngredientList = ({ ingredients, onDelete, onQuantityChange }: IngredientListProps): JSX.Element => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Zutatenliste</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table role="table" aria-label="Zutatenliste mit bearbeitbaren Mengen">
            <TableHeader>
              <TableRow>
                <TableHead>Zutat</TableHead>
                <TableHead className="text-right">Menge</TableHead>
                <TableHead className="text-right">Einheit</TableHead>
                <TableHead className="text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Keine Zutaten hinzugefügt. Fügen Sie oben eine Zutat hinzu, um zu beginnen.
                  </TableCell>
                </TableRow>
              ) : (
                ingredients.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell className="font-medium">{ingredient.name}</TableCell>
                    <TableCell className="text-right">
                      {onQuantityChange ? (
                        <Input
                          type="number"
                          value={ingredient.quantity % 1 === 0 
                            ? ingredient.quantity.toString() 
                            : ingredient.quantity.toFixed(1)}
                          onChange={(e) => {
                            const newQuantity = parseFloat(e.target.value);
                            if (!isNaN(newQuantity) && newQuantity > 0) {
                              onQuantityChange(ingredient.id, newQuantity);
                            }
                          }}
                          className="w-20 text-right"
                          step="0.1"
                          min="0"
                          aria-label={`Menge für ${ingredient.name} bearbeiten`}
                        />
                      ) : (
                        ingredient.quantity % 1 === 0 
                          ? ingredient.quantity.toString() 
                          : ingredient.quantity.toFixed(1)
                      )}
                    </TableCell>
                    <TableCell className="text-right">{ingredient.unit}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(ingredient.id)}
                        aria-label={`${ingredient.name} löschen`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};