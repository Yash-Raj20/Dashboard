"use client";

import * as React from "react";
import { Link } from "react-router-dom";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Table as ReactTable,
} from "@tanstack/react-table";
import { ChevronDown, MoreHorizontal, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import Modal from "@/components/Modal";
import { fetchApi } from "@shared/api";

// ✅ Define Problem type
export type Problem = {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  urgency: string;
  contact: string;
  state: string;
  district: string;
  image: string;
  userId: {
    id: string;
    name: string;
  };
  upvotes: string[];
  status: "Pending" | "Process" | "Resolved";
  createdAt: string;
};

// ✅ Actions dropdown
function ActionsCell({
  problem,
  onAssign,
}: {
  problem: Problem;
  onAssign: (problem: Problem) => void;
}) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAssign(problem)}>
            Assign Problem
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(problem.id)}
          >
            Copy Problem ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              to={`/problems/${problem.id}/${encodeURIComponent(problem.title)}`}
            >
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <StatusDropdown />
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

// ✅ Status submenu
function StatusDropdown() {
  return (
    <span className="ml-2 flex items-center">
      Status
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 items-center ml-8">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={5}>
          <DropdownMenuItem onClick={() => console.log("Resolve clicked")}>
            Resolve
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => console.log("Process clicked")}>
            Process
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => console.log("Pending clicked")}>
            Pending
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}

// ✅ Main component
export default function AllProblems() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [refreshing, setRefreshing] = React.useState(false);
  const [isAssignOpen, setAssignOpen] = React.useState(false);
  const [selectedProblem, setSelectedProblem] = React.useState<Problem | null>(
    null,
  );
  const [subAdmins, setSubAdmins] = React.useState<[]>([]);
  const { data, fetchProblems, loading } = useAuth();

  const handleAssignClick = (problem: Problem) => {
    setSelectedProblem(problem);
    setAssignOpen(true);
  };
  const handleAssign = async (subAdminId: number) => {
  if (!selectedProblem?.id) return;

  try {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      alert("You must be logged in to assign a problem.");
      return;
    }

    // API request
    const data = await fetchApi(`problems/${selectedProblem.id}/assign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subAdminId }),
    });

    alert(data.message || "Problem assigned successfully!");
    setAssignOpen(false); // close modal
  } catch (error) {
    console.error("Error assigning problem:", error);
    alert("Something went wrong.");
  }
};

  React.useEffect(() => {
    fetchProblems();
  }, []);

  const columns: ColumnDef<Problem>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <div>{row.getValue("title")}</div>,
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "urgency",
      header: "Urgency",
    },
    {
      accessorKey: "state",
      header: "State",
    },
    {
      accessorKey: "district",
      header: "District",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("status")}</div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: "actions",
      accessorKey: "id",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => (
        <ActionsCell problem={row.original} onAssign={handleAssignClick} />
      ),
    },
  ];

  const table = useReactTable<Problem>({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      table.reset();
      fetchProblems();
      setRefreshing(false);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        <Header onRefresh={handleRefresh} refreshing={refreshing} />
        <Filters table={table} />
        <ProblemsTable
          table={table}
          loading={loading}
          onAssign={handleAssignClick}
        />
        <Pagination table={table} />
      </div>

      <Modal
        isOpen={isAssignOpen}
        onClose={() => setAssignOpen(false)}
        subAdmins={subAdmins}
        onAssign={handleAssign}
      />
    </DashboardLayout>
  );
}

// ✅ Header component
function Header({
  onRefresh,
  refreshing,
}: {
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          📂 User's All Problems
        </h1>
        <p className="text-muted-foreground">
          View and manage all user-submitted problems in the system.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={refreshing}
          size="sm"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>
    </div>
  );
}

// ✅ Filters component
function Filters({ table }: { table: ReactTable<Problem> }) {
  return (
    <div className="flex items-center py-4">
      <Input
        placeholder="Filter titles..."
        value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
        onChange={(e) =>
          table.getColumn("title")?.setFilterValue(e.target.value)
        }
        className="max-w-sm"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="ml-auto">
            Columns <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                className="capitalize"
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ✅ ProblemsTable component
function ProblemsTable({
  table,
  loading,
  onAssign,
}: {
  table: ReactTable<Problem>;
  loading: boolean;
  onAssign: (problem: Problem) => void;
}) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
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
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-24 text-center"
              >
                Loading problems...
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-24 text-center"
              >
                No problems yet.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ✅ Pagination component
function Pagination({ table }: { table: ReactTable<Problem> }) {
  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <div className="text-muted-foreground flex-1 text-sm">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
