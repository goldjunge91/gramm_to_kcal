import type { CellContext, Column } from "@tanstack/react-table";

import { ArrowUpDown, Trash2, TrendingUp, Weight } from "lucide-react";
import { useMemo, type JSX } from "react";

import type { Product } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  EnhancedTable,
  type EnhancedTableColumn,
} from "@/components/ui/enhanced-table";
import { LoadingButton } from "@/components/ui/loading-button";
import { calculateKcalPer100g } from "@/lib/calculations";

interface ComparisonTableProps {
  products: Product[];
  onReorder?: (newOrder: Product[]) => void;
  onDelete?: (id: string) => Promise<void>;
  isDeleting?: boolean;
  compact?: boolean;
}

/** Enhanced table component for displaying product comparison results with sorting, filtering, and pagination */
export const ComparisonTable = ({
  products,
  onDelete,
  isDeleting = false,
  compact = false,
}: ComparisonTableProps): JSX.Element => {
  // Define columns with new features
  const columns: EnhancedTableColumn<Product>[] = useMemo(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }: { column: Column<Product, unknown> }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Produktname
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info: CellContext<Product, unknown>) => (
          <div className="font-medium">{info.getValue() as string}</div>
        ),
        priority: 1, // Always show on mobile
      },
      {
        id: "quantity",
        accessorKey: "quantity",
        header: ({ column }: { column: Column<Product, unknown> }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 px-2 lg:px-3"
            >
              <Weight className="mr-1 h-4 w-4" />
              Menge (g)
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: (info: CellContext<Product, unknown>) => (
          <div className="text-right">
            {(info.getValue() as number).toLocaleString()}
          </div>
        ),
        priority: 2,
      },
      {
        id: "kcal",
        accessorKey: "kcal",
        header: ({ column }: { column: Column<Product, unknown> }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 px-2 lg:px-3"
            >
              Kalorien (kcal)
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: (info: CellContext<Product, unknown>) => (
          <div className="text-right">
            {(info.getValue() as number).toLocaleString()}
          </div>
        ),
        priority: 3,
      },
      {
        id: "kcalPer100g",
        header: ({ column }: { column: Column<Product, unknown> }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 px-2 lg:px-3"
            >
              <TrendingUp className="mr-1 h-4 w-4" />
              kcal/100g
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: (info: CellContext<Product, unknown>) => (
          <div className="text-right font-semibold text-primary">
            {calculateKcalPer100g(info.row.original).toFixed(1)}
          </div>
        ),
        sortingFn: (rowA: any, rowB: any) => {
          const a = calculateKcalPer100g(rowA.original);
          const b = calculateKcalPer100g(rowB.original);
          return a - b;
        },
        priority: 2, // Important for comparison
      },
      // Add delete column if onDelete is provided
      ...(onDelete
        ? (() => {
            const actionsColumn: EnhancedTableColumn<Product> = {
              id: "actions",
              header: () => <div className="text-right">Aktionen</div>,
              cell: (info: CellContext<Product, unknown>) => (
                <div className="text-right">
                  <LoadingButton
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(info.row.original.id)}
                    loading={isDeleting}
                    aria-label={`${info.row.original.name} löschen`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </LoadingButton>
                </div>
              ),
              draggable: false, // Actions column shouldn't be draggable
              priority: 1,
            };
            return [actionsColumn];
          })()
        : []),
    ],
    [onDelete, isDeleting],
  );

  // Expanded content for each product with detailed nutritional info
  const expandedContent = (row: any) => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Nährwerte per 100g</h4>
          <div className="text-sm text-muted-foreground">
            <div>
              Kalorien: {calculateKcalPer100g(row.original).toFixed(1)} kcal
            </div>
            <div>
              Effizienz:{" "}
              {((row.original.kcal / row.original.quantity) * 100).toFixed(2)}{" "}
              kcal/g
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Produktdetails</h4>
          <div className="text-sm text-muted-foreground">
            <div>Gesamtmenge: {row.original.quantity.toLocaleString()}g</div>
            <div>Gesamtkalorien: {row.original.kcal.toLocaleString()} kcal</div>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Vergleichswerte</h4>
          <div className="text-sm text-muted-foreground">
            <div>
              Rang: {products.findIndex((p) => p.id === row.original.id) + 1}{" "}
              von {products.length}
            </div>
            <div>Kategorie: Lebensmittel</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <EnhancedTable
      data={products}
      columns={columns}
      title="Produktvergleich"
      searchable={true}
      searchPlaceholder="Produkte durchsuchen..."
      pagination={true}
      pageSize={compact ? 5 : 10}
      draggableColumns={true}
      expandableRows={true}
      expandedContent={expandedContent}
      compact={compact}
      getRowCanExpand={() => true} // All products can be expanded for details
      getRowId={(row) => row.id}
    />
  );
};
