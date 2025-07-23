import type { DragEndEvent } from "@dnd-kit/core";
import type { Row } from "@tanstack/react-table";
import type { JSX } from "react";

import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { GripVertical, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Ingredient } from "@/lib/types/types";

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
import { useDeferredInput } from "@/hooks/useDeferredInput";

// Drag Handle Component
function DragHandle({ ingredientId }: { ingredientId: string }) {
    const { attributes, listeners } = useSortable({
        id: ingredientId,
    });

    return (
        <div
            className="flex items-center justify-center cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
        >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
    );
}

// Deferred Quantity Input Component
function DeferredQuantityInput({
    ingredientId,
    currentQuantity,
    onQuantityChange,
    ingredientName,
}: {
    ingredientId: string;
    currentQuantity: number;
    onQuantityChange: (id: string, newQuantity: number) => void;
    ingredientName: string;
}) {
    const { displayValue, isDirty, handleChange, handleBlur, handleKeyDown }
        = useDeferredInput({
            initialValue: currentQuantity,
            onCommit: newValue => onQuantityChange(ingredientId, newValue),
            validator: value => !Number.isNaN(value) && value > 0,
            formatter: value => Number.parseFloat(value),
        });

    return (
        <Input
            type="number"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`w-16 text-right text-sm ${isDirty ? "ring-2 ring-blue-200 dark:ring-blue-800" : ""}`}
            step="0.1"
            min="0.1"
            aria-label={`Skalierte Menge für ${ingredientName} bearbeiten`}
        />
    );
}

// Deferred Scale Factor Input Component
function DeferredScaleFactorInput({
    ingredientId,
    currentScaleFactor,
    onScaleFactorChange,
    ingredientName,
}: {
    ingredientId: string;
    currentScaleFactor: number;
    onScaleFactorChange: (id: string, newScaleFactor: number) => void;
    ingredientName: string;
}) {
    const { displayValue, isDirty, handleChange, handleBlur, handleKeyDown }
        = useDeferredInput({
            initialValue: currentScaleFactor,
            onCommit: newValue => onScaleFactorChange(ingredientId, newValue),
            validator: value => !Number.isNaN(value) && value > 0,
            formatter: value => Number.parseFloat(value),
        });

    return (
        <Input
            type="number"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`w-10 text-right text-xs border-0 p-0 h-4 bg-transparent ${isDirty ? "ring-1 ring-blue-200 dark:ring-blue-800" : ""}`}
            step="0.1"
            min="0.1"
            aria-label={`Skalierungsfaktor für ${ingredientName} bearbeiten`}
        />
    );
}

interface IngredientListProps {
    ingredients: Ingredient[];
    originalIngredients: Ingredient[];
    onDelete: (id: string) => void;
    onQuantityChange?: (id: string, newQuantity: number) => void;
    onScaleFactorChange?: (id: string, newScaleFactor: number) => void;
    onReorder?: (newOrder: Ingredient[]) => void;
}

// Draggable Row Component
function DraggableTableRow({
    row,
    children,
}: {
    row: Row<Ingredient>;
    children: React.ReactNode;
}) {
    const { setNodeRef, transform, transition, isDragging } = useSortable({
        id: row.original.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className={isDragging ? "opacity-50" : ""}
        >
            {children}
        </TableRow>
    );
}

/** Enhanced table component for displaying and managing recipe ingredients with drag-and-drop reordering */
export function IngredientList({
    ingredients,
    originalIngredients,
    onDelete,
    onQuantityChange,
    onScaleFactorChange,
    onReorder,
}: IngredientListProps): JSX.Element {
    const [data, setData] = useState<Ingredient[]>(ingredients);

    // Update local state when ingredients prop changes
    useEffect(() => {
        setData(ingredients);
    }, [ingredients]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const columnHelper = createColumnHelper<Ingredient>();

    const columns = useMemo(
        () => [
            columnHelper.display({
                id: "dragHandle",
                header: () => (
                    <div className="w-12">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                ),
                cell: info => (
                    <DragHandle ingredientId={info.row.original.id} />
                ),
            }),
            columnHelper.accessor("name", {
                header: "Zutat",
                cell: info => (
                    <div className="font-medium">{info.getValue()}</div>
                ),
            }),
            columnHelper.display({
                id: "originalQuantity",
                header: () => <div className="text-right">Urspr. Menge</div>,
                cell: (info) => {
                    const originalIngredient = originalIngredients.find(
                        orig => orig.id === info.row.original.id,
                    );
                    if (!originalIngredient)
                        return <div className="text-right">-</div>;
                    const formattedValue
                        = originalIngredient.quantity % 1 === 0
                            ? originalIngredient.quantity.toString()
                            : originalIngredient.quantity.toFixed(1);
                    return (
                        <div className="text-right text-muted-foreground font-medium">
                            {formattedValue}
                        </div>
                    );
                },
            }),
            columnHelper.accessor("quantity", {
                header: () => <div className="text-right">Skaliert</div>,
                cell: (info) => {
                    const currentQuantity = info.getValue();
                    const originalIngredient = originalIngredients.find(
                        orig => orig.id === info.row.original.id,
                    );
                    const ingredientScaleFactor = originalIngredient
                        ? currentQuantity / originalIngredient.quantity
                        : 1;
                    const formattedValue
                        = currentQuantity % 1 === 0
                            ? currentQuantity.toString()
                            : currentQuantity.toFixed(1);

                    return (
                        <div className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                                {onQuantityChange ? (
                                    <DeferredQuantityInput
                                        ingredientId={info.row.original.id}
                                        currentQuantity={currentQuantity}
                                        onQuantityChange={onQuantityChange}
                                        ingredientName={info.row.original.name}
                                    />
                                ) : (
                                    <div className="font-medium">
                                        {formattedValue}
                                    </div>
                                )}
                                <div className="text-xs text-muted-foreground">
                                    {onScaleFactorChange ? (
                                        <div className="flex items-center">
                                            <DeferredScaleFactorInput
                                                ingredientId={
                                                    info.row.original.id
                                                }
                                                currentScaleFactor={
                                                    ingredientScaleFactor
                                                }
                                                onScaleFactorChange={
                                                    onScaleFactorChange
                                                }
                                                ingredientName={
                                                    info.row.original.name
                                                }
                                            />
                                            <span className="ml-0.5">x</span>
                                        </div>
                                    ) : (
                                        <span>
                                            {ingredientScaleFactor.toFixed(1)}
                                            x
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                },
            }),
            columnHelper.accessor("unit", {
                header: () => <div className="text-right">Einheit</div>,
                cell: info => (
                    <div className="text-right">{info.getValue()}</div>
                ),
            }),
            columnHelper.display({
                id: "actions",
                header: () => <div className="text-right">Aktion</div>,
                cell: info => (
                    <div className="text-right">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(info.row.original.id)}
                            aria-label={`${info.row.original.name} löschen`}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            }),
        ],
        [
            columnHelper,
            originalIngredients,
            onDelete,
            onQuantityChange,
            onScaleFactorChange,
        ],
    );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: row => row.id,
    });

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setData((items) => {
                const oldIndex = items.findIndex(
                    item => item.id === active.id,
                );
                const newIndex = items.findIndex(
                    item => item.id === over?.id,
                );

                const newOrder = arrayMove(items, oldIndex, newIndex);

                // Call the onReorder callback if provided
                if (onReorder) {
                    onReorder(newOrder);
                }

                return newOrder;
            });
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Zutatenliste</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto w-full">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <Table
                            role="table"
                            aria-label="Zutatenliste mit bearbeitbaren Mengen und Reihenfolgenverfolgung"
                            className="min-w-fit w-full"
                        >
                            <TableHeader>
                                {table.getHeaderGroups().map(headerGroup => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <TableHead
                                                key={header.id}
                                                className={
                                                    header.column.id
                                                    === "dragHandle"
                                                        ? "w-12"
                                                        : "whitespace-nowrap px-2 py-1 text-xs md:text-sm"
                                                }
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                            header.column
                                                                .columnDef.header,
                                                            header.getContext(),
                                                        )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    <SortableContext
                                        items={data.map(item => item.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {table.getRowModel().rows.map(row => (
                                            <DraggableTableRow
                                                key={row.id}
                                                row={row}
                                            >
                                                {row
                                                    .getVisibleCells()
                                                    .map(cell => (
                                                        <TableCell
                                                            key={cell.id}
                                                            className={
                                                                cell.column
                                                                    .id
                                                                    === "dragHandle"
                                                                    ? "w-12"
                                                                    : "whitespace-nowrap px-2 py-1 text-xs md:text-sm"
                                                            }
                                                        >
                                                            {flexRender(
                                                                cell.column
                                                                    .columnDef
                                                                    .cell,
                                                                cell.getContext(),
                                                            )}
                                                        </TableCell>
                                                    ))}
                                            </DraggableTableRow>
                                        ))}
                                    </SortableContext>
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center whitespace-nowrap"
                                        >
                                            Keine Zutaten hinzugefügt. Fügen Sie
                                            oben eine Zutat hinzu, um zu
                                            beginnen.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </DndContext>
                </div>
            </CardContent>
        </Card>
    );
}
