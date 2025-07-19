pnpm dlx shadcn@latest add https://originui.com/r/comp-84.json

Code

import { SparklesIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function Component() {
return (
<Button variant="outline">
Button
<SparklesIcon className="-me-1 opacity-60" size={16} aria-hidden="true" />
</Button>
)
}
npm dlx shadcn@latest add https://originui.com/r/comp-91.json

Code

"use client"

import { useState } from "react"
import { LoaderCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function Component() {
const [isLoading, setIsLoading] = useState<boolean>(false)

const handleClick = () => {
setIsLoading(true)
// Simulate an async operation
setTimeout(() => {
setIsLoading(false)
}, 1000) // Reset after 1 second
}

return (
<Button
onClick={handleClick}
disabled={isLoading}
data-loading={isLoading || undefined}
className="group relative disabled:opacity-100" >
<span className="group-data-loading:text-transparent">Click me</span>
{isLoading && (
<div className="absolute inset-0 flex items-center justify-center">
<LoaderCircleIcon
            className="animate-spin"
            size={16}
            aria-hidden="true"
          />
</div>
)}
</Button>
)
}

pnpm dlx shadcn@latest add https://originui.com/r/comp-590.json

Code

import {
CompassIcon,
FeatherIcon,
HouseIcon,
PlusIcon,
SearchIcon,
} from "lucide-react"

import NotificationMenu from "@/registry/default/components/navbar-components/notification-menu"
import TeamSwitcher from "@/registry/default/components/navbar-components/team-switcher"
import UserMenu from "@/registry/default/components/navbar-components/user-menu"
import { Button } from "@/components/ui/button"
import {
NavigationMenu,
NavigationMenuItem,
NavigationMenuLink,
NavigationMenuList,
} from "@/components/ui/navigation-menu"
import {
Popover,
PopoverContent,
PopoverTrigger,
} from "@/components/ui/popover"

const teams = ["Acme Inc.", "Origin UI", "Junon"]

// Navigation links array to be used in both desktop and mobile menus
const navigationLinks = [
{ href: "#", label: "Dashboard", icon: HouseIcon },
{ href: "#", label: "Explore", icon: CompassIcon },
{ href: "#", label: "Write", icon: FeatherIcon },
{ href: "#", label: "Search", icon: SearchIcon },
]

export default function Component() {
return (
<header className="border-b px-4 md:px-6">
<div className="flex h-16 items-center justify-between gap-4">
{/_ Left side _/}
<div className="flex flex-1 items-center gap-2">
{/_ Mobile menu trigger _/}
<Popover>
<PopoverTrigger asChild>
<Button
                className="group size-8 md:hidden"
                variant="ghost"
                size="icon"
              >
<svg
                  className="pointer-events-none"
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  xmlns="http://www.w3.org/2000/svg"
                >
<path
                    d="M4 12L20 12"
                    className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
                  />
<path
                    d="M4 12H20"
                    className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                  />
<path
                    d="M4 12H20"
                    className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
                  />
</svg>
</Button>
</PopoverTrigger>
<PopoverContent align="start" className="w-48 p-1 md:hidden">
<NavigationMenu className="max-w-none *:w-full">
<NavigationMenuList className="flex-col items-start gap-0 md:gap-2">
{navigationLinks.map((link, index) => {
const Icon = link.icon
return (
<NavigationMenuItem key={index} className="w-full">
<NavigationMenuLink
                          href={link.href}
                          className="flex-row items-center gap-2 py-1.5"
                        >
<Icon
                            size={16}
                            className="text-muted-foreground"
                            aria-hidden="true"
                          />
<span>{link.label}</span>
</NavigationMenuLink>
</NavigationMenuItem>
)
})}
</NavigationMenuList>
</NavigationMenu>
</PopoverContent>
</Popover>
<TeamSwitcher teams={teams} defaultTeam={teams[0]} />
</div>
{/_ Middle area _/}
<NavigationMenu className="max-md:hidden">
<NavigationMenuList className="gap-2">
{navigationLinks.map((link, index) => {
const Icon = link.icon
return (
<NavigationMenuItem key={index}>
<NavigationMenuLink
                    href={link.href}
                    className="flex size-8 items-center justify-center p-1.5"
                    title={link.label}
                  >
<Icon aria-hidden="true" />
<span className="sr-only">{link.label}</span>
</NavigationMenuLink>
</NavigationMenuItem>
)
})}
</NavigationMenuList>
</NavigationMenu>
{/_ Right side _/}
<div className="flex flex-1 items-center justify-end gap-4">
<Button size="sm" className="text-sm max-sm:aspect-square max-sm:p-0">
<PlusIcon
              className="opacity-60 sm:-ms-1"
              size={16}
              aria-hidden="true"
            />
<span className="max-sm:sr-only">Post</span>
</Button>
<NotificationMenu />
<UserMenu />
</div>
</div>
</header>
)
}

# for this next follwing code tables i want both functionality combinded:

pnpm dlx shadcn@latest add https://originui.com/r/comp-481.json

Code

"use client"

import { CSSProperties, useEffect, useId, useState } from "react"
import {
closestCenter,
DndContext,
KeyboardSensor,
MouseSensor,
TouchSensor,
useSensor,
useSensors,
type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import {
arrayMove,
horizontalListSortingStrategy,
SortableContext,
useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
Cell,
ColumnDef,
flexRender,
getCoreRowModel,
getSortedRowModel,
Header,
SortingState,
useReactTable,
} from "@tanstack/react-table"
import { ChevronDownIcon, ChevronUpIcon, GripVerticalIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow,
} from "@/components/ui/table"

type Item = {
id: string
name: string
email: string
location: string
flag: string
status: "Active" | "Inactive" | "Pending"
balance: number
}

const columns: ColumnDef<Item>[] = [
{
id: "name",
header: "Name",
accessorKey: "name",
cell: ({ row }) => (
<div className="truncate font-medium">{row.getValue("name")}</div>
),
sortUndefined: "last",
sortDescFirst: false,
},
{
id: "email",
header: "Email",
accessorKey: "email",
},
{
id: "location",
header: "Location",
accessorKey: "location",
cell: ({ row }) => (
<div className="truncate">
<span className="text-lg leading-none">{row.original.flag}</span>{" "}
{row.getValue("location")}
</div>
),
},
{
id: "status",
header: "Status",
accessorKey: "status",
},
{
id: "balance",
header: "Balance",
accessorKey: "balance",
cell: ({ row }) => {
const amount = parseFloat(row.getValue("balance"))
const formatted = new Intl.NumberFormat("en-US", {
style: "currency",
currency: "USD",
}).format(amount)
return formatted
},
},
]

export default function Component() {
const [data, setData] = useState<Item[]>([])
const [sorting, setSorting] = useState<SortingState>([])
const [columnOrder, setColumnOrder] = useState<string[]>(
columns.map((column) => column.id as string)
)

useEffect(() => {
async function fetchPosts() {
const res = await fetch(
"https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/users-01_fertyx.json"
)
const data = await res.json()
setData(data.slice(0, 5)) // Limit to 5 items
}
fetchPosts()
}, [])

const table = useReactTable({
data,
columns,
columnResizeMode: "onChange",
getCoreRowModel: getCoreRowModel(),
getSortedRowModel: getSortedRowModel(),
onSortingChange: setSorting,
state: {
sorting,
columnOrder,
},
onColumnOrderChange: setColumnOrder,
enableSortingRemoval: false,
})

// reorder columns after drag & drop
function handleDragEnd(event: DragEndEvent) {
const { active, over } = event
if (active && over && active.id !== over.id) {
setColumnOrder((columnOrder) => {
const oldIndex = columnOrder.indexOf(active.id as string)
const newIndex = columnOrder.indexOf(over.id as string)
return arrayMove(columnOrder, oldIndex, newIndex) //this is just a splice util
})
}
}

const sensors = useSensors(
useSensor(MouseSensor, {}),
useSensor(TouchSensor, {}),
useSensor(KeyboardSensor, {})
)

return (
<DndContext
      id={useId()}
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
<Table>
<TableHeader>
{table.getHeaderGroups().map((headerGroup) => (
<TableRow key={headerGroup.id} className="bg-muted/50">
<SortableContext
                items={columnOrder}
                strategy={horizontalListSortingStrategy}
              >
{headerGroup.headers.map((header) => (
<DraggableTableHeader key={header.id} header={header} />
))}
</SortableContext>
</TableRow>
))}
</TableHeader>
<TableBody>
{table.getRowModel().rows?.length ? (
table.getRowModel().rows.map((row) => (
<TableRow
key={row.id}
data-state={row.getIsSelected() && "selected"} >
{row.getVisibleCells().map((cell) => (
<SortableContext
                    key={cell.id}
                    items={columnOrder}
                    strategy={horizontalListSortingStrategy}
                  >
<DragAlongCell key={cell.id} cell={cell} />
</SortableContext>
))}
</TableRow>
))
) : (
<TableRow>
<TableCell colSpan={columns.length} className="h-24 text-center">
No results.
</TableCell>
</TableRow>
)}
</TableBody>
</Table>
<p className="text-muted-foreground mt-4 text-center text-sm">
Draggable columns made with{" "}
<a
          className="hover:text-foreground underline"
          href="https://tanstack.com/table"
          target="_blank"
          rel="noopener noreferrer"
        >
TanStack Table
</a>{" "}
and{" "}
<a href="https://dndkit.com/" target="_blank" rel="noopener noreferrer">
dnd kit
</a>
</p>
</DndContext>
)
}

const DraggableTableHeader = ({
header,
}: {
header: Header<Item, unknown>
}) => {
const {
attributes,
isDragging,
listeners,
setNodeRef,
transform,
transition,
} = useSortable({
id: header.column.id,
})

const style: CSSProperties = {
opacity: isDragging ? 0.8 : 1,
position: "relative",
transform: CSS.Translate.toString(transform),
transition,
whiteSpace: "nowrap",
width: header.column.getSize(),
zIndex: isDragging ? 1 : 0,
}

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
} >
<div className="flex items-center justify-start gap-0.5">
<Button
size="icon"
variant="ghost"
className="-ml-2 size-7 shadow-none"
{...attributes}
{...listeners}
aria-label="Drag to reorder" >
<GripVerticalIcon
            className="opacity-60"
            size={16}
            aria-hidden="true"
          />
</Button>
<span className="grow truncate">
{header.isPlaceholder
? null
: flexRender(header.column.columnDef.header, header.getContext())}
</span>
<Button
size="icon"
variant="ghost"
className="group -mr-1 size-7 shadow-none"
onClick={header.column.getToggleSortingHandler()}
onKeyDown={(e) => {
// Enhanced keyboard handling for sorting
if (
header.column.getCanSort() &&
(e.key === "Enter" || e.key === " ")
) {
e.preventDefault()
header.column.getToggleSortingHandler()?.(e)
}
}} >
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
</div>
</TableHead>
)
}

const DragAlongCell = ({ cell }: { cell: Cell<Item, unknown> }) => {
const { isDragging, setNodeRef, transform, transition } = useSortable({
id: cell.column.id,
})

const style: CSSProperties = {
opacity: isDragging ? 0.8 : 1,
position: "relative",
transform: CSS.Translate.toString(transform),
transition,
width: cell.column.getSize(),
zIndex: isDragging ? 1 : 0,
}

return (
<TableCell ref={setNodeRef} className="truncate" style={style}>
{flexRender(cell.column.columnDef.cell, cell.getContext())}
</TableCell>
)
}
pnpm dlx shadcn@latest add https://originui.com/r/comp-482.json
"use client"

import { Fragment, useEffect, useState } from "react"
import {
ColumnDef,
flexRender,
getCoreRowModel,
getExpandedRowModel,
useReactTable,
} from "@tanstack/react-table"
import { ChevronDownIcon, ChevronUpIcon, InfoIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow,
} from "@/components/ui/table"

type Item = {
id: string
name: string
email: string
location: string
flag: string
status: "Active" | "Inactive" | "Pending"
balance: number
note?: string
}

const columns: ColumnDef<Item>[] = [
{
id: "expander",
header: () => null,
cell: ({ row }) => {
return row.getCanExpand() ? (
<Button
{...{
className: "size-7 shadow-none text-muted-foreground",
onClick: row.getToggleExpandedHandler(),
"aria-expanded": row.getIsExpanded(),
"aria-label": row.getIsExpanded()
? `Collapse details for ${row.original.name}`
: `Expand details for ${row.original.name}`,
size: "icon",
variant: "ghost",
}}
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
) : undefined
},
},
{
id: "select",
header: ({ table }) => (
<Checkbox
checked={
table.getIsAllPageRowsSelected() ||
(table.getIsSomePageRowsSelected() && "indeterminate")
}
onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
aria-label="Select all"
/>
),
cell: ({ row }) => (
<Checkbox
checked={row.getIsSelected()}
onCheckedChange={(value) => row.toggleSelected(!!value)}
aria-label="Select row"
/>
),
},
{
header: "Name",
accessorKey: "name",
cell: ({ row }) => (
<div className="font-medium">{row.getValue("name")}</div>
),
},
{
header: "Email",
accessorKey: "email",
},
{
header: "Location",
accessorKey: "location",
cell: ({ row }) => (
<div>
<span className="text-lg leading-none">{row.original.flag}</span>{" "}
{row.getValue("location")}
</div>
),
},
{
header: "Status",
accessorKey: "status",
cell: ({ row }) => (
<Badge
className={cn(
row.getValue("status") === "Inactive" &&
"bg-muted-foreground/60 text-primary-foreground"
)}
>
{row.getValue("status")}
</Badge>
),
},
{
header: () => <div className="text-right">Balance</div>,
accessorKey: "balance",
cell: ({ row }) => {
const amount = parseFloat(row.getValue("balance"))
const formatted = new Intl.NumberFormat("en-US", {
style: "currency",
currency: "USD",
}).format(amount)
return <div className="text-right">{formatted}</div>
},
},
]

export default function Component() {
const [data, setData] = useState<Item[]>([])

useEffect(() => {
async function fetchPosts() {
const res = await fetch(
"https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/users-01_fertyx.json"
)
const data = await res.json()
setData(data.slice(0, 5)) // Limit to 5 items
}
fetchPosts()
}, [])

const table = useReactTable({
data,
columns,
getRowCanExpand: (row) => Boolean(row.original.note),
getCoreRowModel: getCoreRowModel(),
getExpandedRowModel: getExpandedRowModel(),
})

return (
<div>
<Table>
<TableHeader>
{table.getHeaderGroups().map((headerGroup) => (
<TableRow key={headerGroup.id} className="hover:bg-transparent">
{headerGroup.headers.map((header) => {
return (
<TableHead key={header.id}>
{header.isPlaceholder
? null
: flexRender(
header.column.columnDef.header,
header.getContext()
)}
</TableHead>
)
})}
</TableRow>
))}
</TableHeader>
<TableBody>
{table.getRowModel().rows?.length ? (
table.getRowModel().rows.map((row) => (
<Fragment key={row.id}>
<TableRow
key={row.id}
data-state={row.getIsSelected() && "selected"} >
{row.getVisibleCells().map((cell) => (
<TableCell
                      key={cell.id}
                      className="whitespace-nowrap [&:has([aria-expanded])]:w-px [&:has([aria-expanded])]:py-0 [&:has([aria-expanded])]:pr-0"
                    >
{flexRender(
cell.column.columnDef.cell,
cell.getContext()
)}
</TableCell>
))}
</TableRow>
{row.getIsExpanded() && (
<TableRow>
<TableCell colSpan={row.getVisibleCells().length}>
<div className="text-primary/80 flex items-start py-2">
<span
                          className="me-3 mt-0.5 flex w-7 shrink-0 justify-center"
                          aria-hidden="true"
                        >
<InfoIcon className="opacity-60" size={16} />
</span>
<p className="text-sm">{row.original.note}</p>
</div>
</TableCell>
</TableRow>
)}
</Fragment>
))
) : (
<TableRow>
<TableCell colSpan={columns.length} className="h-24 text-center">
No results.
</TableCell>
</TableRow>
)}
</TableBody>
</Table>
<p className="text-muted-foreground mt-4 text-center text-sm">
Expanding sub-row made with{" "}
<a
          className="hover:text-foreground underline"
          href="https://tanstack.com/table"
          target="_blank"
          rel="noopener noreferrer"
        >
TanStack Table
</a>
</p>
</div>
)
}
