import { Product } from "@/lib/types";
import { calculateKcalPer100g } from "@/lib/calculations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JSX } from "react";

interface ComparisonTableProps {
  products: Product[];
}

/** Table component for displaying product comparison results */
export const ComparisonTable = ({ products }: ComparisonTableProps): JSX.Element => {
  const sortedProducts = [...products].sort((a, b) => 
    calculateKcalPer100g(a) - calculateKcalPer100g(b)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produktvergleich</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table role="table" aria-label="Produktvergleich sortiert nach Kalorien pro 1g">
            <TableHeader>
              <TableRow>
                <TableHead>Produktname</TableHead>
                <TableHead className="text-right">Menge (g)</TableHead>
                <TableHead className="text-right">Kalorien (kcal)</TableHead>
                <TableHead className="text-right">kcal/1g</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Keine Produkte hinzugefügt. Fügen Sie oben ein Produkt hinzu, um den Vergleich zu starten.
                  </TableCell>
                </TableRow>
              ) : (
                sortedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">{product.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{product.kcal.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {calculateKcalPer100g(product).toFixed(1)}
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