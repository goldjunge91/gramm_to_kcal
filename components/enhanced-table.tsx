"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import type {
    Cell,
    ColumnDef,
    ExpandedState,
    Header,
    Row,
    SortingState,
    TableOptions,
} from "@tanstack/react-table";
import type { CSSProperties, ReactNode } from "react";

import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
    arrayMove,
    horizontalListSortingStrategy,
    SortableContext,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronUpIcon,
    GripVerticalIcon,
    InfoIcon,
} from "lucide-react";
import { Fragment, useId, useMemo, useState } from "react";

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
import { cn } from "@/lib/utils";

// Types for enhanced table
export type TableColumn<T> = ColumnDef<T, any> & {
    draggable?: boolean;
    expandable?: boolean;
    priority?: number; // For responsive hiding (1 = highest priority, show on mobile)
};

export interface TableProps<T> {
    data: T[];
    columns: TableColumn<T>[];
    title?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
    pagination?: boolean;
    pageSize?: number;
    draggableColumns?: boolean;
    expandableRows?: boolean;
    expandedContent?: (row: Row<T>) => ReactNode;
    onColumnOrderChange?: (newOrder: string[]) => void;
    onRowExpand?: (row: Row<T>) => void;
    compact?: boolean;
    className?: string;
    getRowCanExpand?: (row: Row<T>) => boolean;
    getRowId?: (originalRow: T, index: number) => string;
}

// Draggable Table Header Component
function DraggableTableHeader<T>({ header }: { header: Header<T, unknown> }) {
    const {
        attributes,
        isDragging,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({
        id: header.column.id,
    });

    const style: CSSProperties = {
        opacity: isDragging ? 0.8 : 1,
        position: "relative",
        transform: CSS.Translate.toString(transform),
        transition,
        whiteSpace: "nowrap",
        width: header.column.getSize(),
        zIndex: isDragging ? 1 : 0,
    };

    const isDraggableColumn
        = (header.column.columnDef as TableColumn<T>).draggable !== false;

    return (
        <TableHead
            ref={setNodeRef}
            className="before:bg-border relative h-10 border-t before:absolute before:inset-y-0 before:start-0 before:w-px first:before:bg-transparent"
            style={style}
            aria-sort={
                header.column.getIsSorted() === "asc"
                    ? "ascending"
                    : header.column.getIsSorted() === "desc"
                        ? "descending"
                        : "none"
            }
        >
            <div className="flex items-center justify-start gap-0.5">
                {isDraggableColumn && (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="-ml-2 size-7 shadow-none"
                        {...attributes}
                        {...listeners}
                        aria-label="Drag to reorder"
                    >
                        <GripVerticalIcon
                            className="opacity-60"
                            size={16}
                            aria-hidden="true"
                        />
                    </Button>
                )}
                <span className="grow truncate">
                    {header.isPlaceholder
                        ? null
                        : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                            )}
                </span>
                {header.column.getCanSort() && (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="group -mr-1 size-7 shadow-none"
                        onClick={header.column.getToggleSortingHandler()}
                        onKeyDown={(e) => {
                            if (
                                header.column.getCanSort()
                                && (e.key === "Enter" || e.key === " ")
                            ) {
                                e.preventDefault();
                                header.column.getToggleSortingHandler()?.(e);
                            }
                        }}
                    >
                        {{
                            asc: (
                                <ChevronUpIcon
                                    className="shrink-0 opacity-60"
                                    size={16}
                                    aria-hidden="true"
                                />
                            ),
                            desc: (
                                <ChevronDownIcon
                                    className="shrink-0 opacity-60"
                                    size={16}
                                    aria-hidden="true"
                                />
                            ),
                        }[header.column.getIsSorted() as string] ?? (
                            <ChevronUpIcon
                                className="shrink-0 opacity-0 group-hover:opacity-60"
                                size={16}
                                aria-hidden="true"
                            />
                        )}
                    </Button>
                )}
            </div>
        </TableHead>
    );
}

// Drag Along Cell Component
function DragAlongCell<T>({ cell }: { cell: Cell<T, unknown> }) {
    const { isDragging, setNodeRef, transform, transition } = useSortable({
        id: cell.column.id,
    });

    const style: CSSProperties = {
        opacity: isDragging ? 0.8 : 1,
        position: "relative",
        transform: CSS.Translate.toString(transform),
        transition,
        width: cell.column.getSize(),
        zIndex: isDragging ? 1 : 0,
    };

    return (
        <TableCell ref={setNodeRef} className="truncate" style={style}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
    );
}

// Main Enhanced Table Component
export function EnhancedTable<T>({
    data,
    columns,
    title,
    searchable = false,
    searchPlaceholder = "Search...",
    pagination = false,
    pageSize = 10,
    draggableColumns = false,
    expandableRows = false,
    expandedContent,
    onColumnOrderChange,
    onRowExpand,
    compact = false,
    className,
    getRowCanExpand,
    getRowId,
}: TableProps<T>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [expanded, setExpanded] = useState<ExpandedState>({});
    const [columnOrder, setColumnOrder] = useState<string[]>(
        columns.map(column => (column as any).id as string).filter(Boolean),
    );

    // Add expand column if expandableRows is enabled
    const enhancedColumns: TableColumn<T>[] = useMemo(() => {
        if (!expandableRows)
            return columns;

        const expandColumn: TableColumn<T> = {
            id: "expander",
            header: () => null,
            cell: ({ row }: { row: Row<T> }) => {
                return row.getCanExpand() ? (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 shadow-none text-muted-foreground"
                        onClick={() => {
                            row.getToggleExpandedHandler()();
                            onRowExpand?.(row);
                        }}
                        aria-expanded={row.getIsExpanded()}
                        aria-label={
                            row.getIsExpanded()
                                ? `Collapse details`
                                : `Expand details`
                        }
                    >
                        {row.getIsExpanded() ? (
                            <ChevronUpIcon
                                className="opacity-60"
                                size={16}
                                aria-hidden="true"
                            />
                        ) : (
                            <ChevronDownIcon
                                className="opacity-60"
                                size={16}
                                aria-hidden="true"
                            />
                        )}
                    </Button>
                ) : null;
            },
            draggable: false,
        };

        return [expandColumn, ...columns];
    }, [columns, expandableRows, onRowExpand]);

    // Table configuration
    const tableConfig: TableOptions<T> = {
        data,
        columns: enhancedColumns,
        getCoreRowModel: getCoreRowModel(),
        ...(pagination && { getPaginationRowModel: getPaginationRowModel() }),
        ...(searchable && { getFilteredRowModel: getFilteredRowModel() }),
        getSortedRowModel: getSortedRowModel(),
        ...(expandableRows && {
            getExpandedRowModel: getExpandedRowModel(),
            getRowCanExpand: getRowCanExpand || (() => true),
        }),
        onSortingChange: setSorting,
        ...(searchable && { onGlobalFilterChange: setGlobalFilter }),
        ...(expandableRows && { onExpandedChange: setExpanded }),
        ...(draggableColumns && { onColumnOrderChange: setColumnOrder }),
        state: {
            sorting,
            ...(searchable && { globalFilter }),
            ...(expandableRows && { expanded }),
            ...(draggableColumns && { columnOrder }),
        },
        ...(pagination && {
            initialState: {
                pagination: {
                    pageSize: compact
                        ? Math.max(5, Math.floor(pageSize / 2))
                        : pageSize,
                },
            },
        }),
        ...(getRowId && { getRowId }),
    };

    const table = useReactTable(tableConfig);

    // Handle column drag and drop
    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            setColumnOrder((columnOrder) => {
                const oldIndex = columnOrder.indexOf(active.id as string);
                const newIndex = columnOrder.indexOf(over.id as string);
                const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
                onColumnOrderChange?.(newOrder);
                return newOrder;
            });
        }
    }

    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {}),
    );

    const tableContent = (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id} className="bg-muted/50">
                            {draggableColumns ? (
                                <SortableContext
                                    items={columnOrder}
                                    strategy={horizontalListSortingStrategy}
                                >
                                    {headerGroup.headers.map(header => (
                                        <DraggableTableHeader
                                            key={header.id}
                                            header={header}
                                        />
                                    ))}
                                </SortableContext>
                            ) : (
                                headerGroup.headers.map(header => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                    header.column.columnDef
                                                        .header,
                                                    header.getContext(),
                                                )}
                                    </TableHead>
                                ))
                            )}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map(row => (
                            <Fragment key={row.id}>
                                <TableRow
                                    key={`${row.id}-main`}
                                    data-state={
                                        row.getIsSelected() && "selected"
                                    }
                                >
                                    {row.getVisibleCells().map(cell =>
                                        draggableColumns ? (
                                            <SortableContext
                                                key={cell.id}
                                                items={columnOrder}
                                                strategy={
                                                    horizontalListSortingStrategy
                                                }
                                            >
                                                <DragAlongCell
                                                    key={cell.id}
                                                    cell={cell}
                                                />
                                            </SortableContext>
                                        ) : (
                                            <TableCell
                                                key={cell.id}
                                                className={cn(
                                                    "whitespace-nowrap",
                                                    expandableRows
                                                    && "[&:has([aria-expanded])]:w-px [&:has([aria-expanded])]:py-0 [&:has([aria-expanded])]:pr-0",
                                                )}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </TableCell>
                                        ),
                                    )}
                                </TableRow>
                                {expandableRows && row.getIsExpanded() && (
                                    <TableRow key={`${row.id}-expanded`}>
                                        <TableCell
                                            colSpan={
                                                row.getVisibleCells().length
                                            }
                                        >
                                            <div className="text-primary/80 flex items-start py-2">
                                                <span
                                                    className="me-3 mt-0.5 flex w-7 shrink-0 justify-center"
                                                    aria-hidden="true"
                                                >
                                                    <InfoIcon
                                                        className="opacity-60"
                                                        size={16}
                                                    />
                                                </span>
                                                <div className="flex-1">
                                                    {expandedContent ? (
                                                        expandedContent(row)
                                                    ) : (
                                                        <p className="text-sm">
                                                            Expanded content
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </Fragment>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={enhancedColumns.length}
                                className="h-24 text-center"
                            >
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

    const wrappedTable = draggableColumns ? (
        <DndContext
            id={useId()}
            collisionDetection={closestCenter}
            modifiers={[restrictToHorizontalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
        >
            {tableContent}
        </DndContext>
    ) : (
        tableContent
    );

    if (!title && !searchable && !pagination) {
        return <div className={className}>{wrappedTable}</div>;
    }

    return (
        <Card className={className}>
            {(title || searchable) && (
                <CardHeader>
                    {title && <CardTitle>{title}</CardTitle>}
                    {searchable && (
                        <div className="flex items-center py-4">
                            <Input
                                placeholder={searchPlaceholder}
                                value={globalFilter ?? ""}
                                onChange={event =>
                                    setGlobalFilter(event.target.value)}
                                className={compact ? "w-full" : "max-w-sm"}
                            />
                        </div>
                    )}
                </CardHeader>
            )}
            <CardContent>
                {wrappedTable}

                {/* Pagination Controls */}
                {pagination && data.length > 0 && (
                    <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                            {table.getFilteredRowModel().rows.length}
                            {" "}
                            von
                            {data.length}
                            {" "}
                            Einträgen
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <ChevronLeftIcon className="h-4 w-4" />
                                Zurück
                            </Button>
                            <div className="flex items-center space-x-1">
                                <div className="text-sm font-medium">
                                    Seite
                                    {" "}
                                    {table.getState().pagination.pageIndex + 1}
                                    {" "}
                                    von
                                    {" "}
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
                                <ChevronRightIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Export types for compatibility
export type EnhancedTableColumn<TData> = ColumnDef<TData>;
