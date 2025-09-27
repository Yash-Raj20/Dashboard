import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, MoreHorizontal, Users as UsersIcon, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export type DashboardUser = {
  _id: string;
  name: string;
  email: string;
  location: string;
  gender?: string;
  dob?: string;
  createdAt: string;
  profileImage?: string;
  loginActivity?: { timestamp: string }[];
};

export default function Users() {
  const { loading, error, fetchUsers, users } = useAuth();
  const [filteredUsers, setFilteredUsers] = useState<DashboardUser[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = users;

    if (filter !== "all") {
      result = result.filter((u) => u.location === filter);
    }

    if (search.trim() !== "") {
      const lowerSearch = search.toLowerCase();
      result = result.filter((u) => u.name.toLowerCase().includes(lowerSearch));
    }

    setFilteredUsers(result);
  }, [filter, search, users]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const locations = Array.from(new Set(users.map((u) => u.location))).filter(Boolean);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">View and manage registered users</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            </div>

            {/* Location Filter */}
            <Select onValueChange={setFilter} value={filter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}.{" "}
              <Button variant="link" onClick={fetchUsers} className="p-0 h-auto">
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <CardDescription>Manage user accounts and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <Skeleton className="h-6 w-[80px]" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <UsersIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No users found</p>
                <p className="text-sm">Try adjusting your filter or search</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const lastLogin =
                      user.loginActivity?.length > 0
                        ? user.loginActivity[user.loginActivity.length - 1].timestamp
                        : null;

                    return (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <img
                              src={user.profileImage || "/placeholder-avatar.png"}
                              alt={user.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                            <span>{user.name}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{user.email}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm">{user.location || "—"}</span>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm capitalize">{user.gender || "—"}</span>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm">{user.dob ? formatDate(user.dob) : "—"}</span>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm">{formatDate(user.createdAt)}</span>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {lastLogin ? formatDate(lastLogin) : "Never"}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => alert("View Profile")}>
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}