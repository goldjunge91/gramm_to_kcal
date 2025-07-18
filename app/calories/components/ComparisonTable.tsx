import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState, type JSX } from "react";

import type { Product } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateKcalPer100g } from "@/lib/calculations";

interface ComparisonTableProps {
  products: Product[];
  onReorder?: (newOrder: Product[]) => void;
}

/** Enhanced table component for displaying product comparison results with sorting, filtering, and pagination */
export const ComparisonTable = ({
  products,
}: ComparisonTableProps): JSX.Element => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Create column helper for type safety
  const columnHelper = createColumnHelper<Product>();

  // Define columns with TanStack Table
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Produktname
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => <div className="font-medium">{info.getValue()}</div>,
      }),
      columnHelper.accessor("quantity", {
        header: ({ column }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 px-2 lg:px-3"
            >
              Menge (g)
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: (info) => (
          <div className="text-right">{info.getValue().toLocaleString()}</div>
        ),
      }),
      columnHelper.accessor("kcal", {
        header: ({ column }) => (
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
        cell: (info) => (
          <div className="text-right">{info.getValue().toLocaleString()}</div>
        ),
      }),
      columnHelper.display({
        id: "kcalPer1g",
        header: ({ column }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 px-2 lg:px-3"
            >
              kcal/1g
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: (info) => (
          <div className="text-right font-semibold">
            {calculateKcalPer100g(info.row.original).toFixed(1)}
          </div>
        ),
        sortingFn: (rowA, rowB) => {
          const a = calculateKcalPer100g(rowA.original);
          const b = calculateKcalPer100g(rowB.original);
          return a - b;
        },
      }),
    ],
    [columnHelper],
  );

  // Initialize table
  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produktvergleich</CardTitle>
        <div className="flex items-center py-4">
          <Input
            placeholder="Produkte durchsuchen..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table
            role="table"
            aria-label="Produktvergleich mit Sortierung und Filter"
          >
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Keine Produkte hinzugefügt. Fügen Sie oben ein Produkt
                    hinzu, um den Vergleich zu starten.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {products.length > 0 && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} von {products.length}{" "}
              Produkten
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
                Zurück
              </Button>
              <div className="flex items-center space-x-1">
                <div className="text-sm font-medium">
                  Seite {table.getState().pagination.pageIndex + 1} von{" "}
                  {table.getPageCount()}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Weiter
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
