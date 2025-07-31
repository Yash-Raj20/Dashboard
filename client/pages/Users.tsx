import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, CreateUserRequest, UpdateUserRequest } from "@shared/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  UserPlus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Users as UsersIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Users() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    email: "",
    name: "",
    password: "",
  });
  const [updateForm, setUpdateForm] = useState<UpdateUserRequest>({});
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token. Please log in.");
      }

      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let data;
      try {
        const text = await response.text();
        if (!text.trim()) {
          throw new Error("Empty response from server");
        }

        if (text.trim().startsWith("<")) {
          if (response.status === 401) {
            throw new Error("Session expired. Please log in again.");
          }
          throw new Error(
            `Server returned HTML instead of JSON (${response.status})`,
          );
        }

        data = JSON.parse(text);
      } catch (parseError) {
        if (
          parseError instanceof Error &&
          parseError.message.includes("log in again")
        ) {
          throw parseError;
        }
        if (response.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(`Invalid response format (${response.status})`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch users");
      }

      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!validateCreateForm()) return;

    try {
      setFormLoading(true);
      setFormErrors([]);

      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      });

      let data;
      try {
        const text = await response.text();
        if (!text.trim()) {
          throw new Error("Empty response from server");
        }

        // Check if response is HTML (likely an error page)
        if (text.trim().startsWith("<")) {
          if (response.status === 401) {
            throw new Error("Session expired. Please log in again.");
          }
          throw new Error(`Server error (${response.status})`);
        }

        data = JSON.parse(text);
      } catch (parseError) {
        if (
          parseError instanceof Error &&
          parseError.message.includes("log in again")
        ) {
          throw parseError;
        }
        if (response.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(`Invalid response from server (${response.status})`);
      }

      if (!response.ok) {
        // Handle validation errors with details
        if (data.details && Array.isArray(data.details)) {
          setFormErrors(data.details);
          return;
        }
        throw new Error(data.error || "Failed to create user");
      }
      setUsers((prev) => [...prev, data.user]);
      setCreateDialogOpen(false);
      resetCreateForm();

      toast({
        title: "Success",
        description: "User created successfully",
      });
    } catch (err) {
      setFormErrors([err instanceof Error ? err.message : "An error occurred"]);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setFormLoading(true);
      setFormErrors([]);

      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateForm),
      });

      let data;
      try {
        const text = await response.text();
        if (!text.trim()) {
          throw new Error("Empty response from server");
        }

        if (text.trim().startsWith("<")) {
          if (response.status === 401) {
            throw new Error("Session expired. Please log in again.");
          }
          throw new Error(`Server error (${response.status})`);
        }

        data = JSON.parse(text);
      } catch (parseError) {
        if (
          parseError instanceof Error &&
          parseError.message.includes("log in again")
        ) {
          throw parseError;
        }
        if (response.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(`Invalid response from server (${response.status})`);
      }

      if (!response.ok) {
        // Handle validation errors with details
        if (data.details && Array.isArray(data.details)) {
          setFormErrors(data.details);
          return;
        }
        throw new Error(data.error || "Failed to update user");
      }
      setUsers((prev) =>
        prev.map((user) => (user.id === selectedUser.id ? data.user : user)),
      );
      setEditDialogOpen(false);
      setSelectedUser(null);
      setUpdateForm({});

      toast({
        title: "Success",
        description: "User updated successfully",
      });
    } catch (err) {
      setFormErrors([err instanceof Error ? err.message : "An error occurred"]);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.name}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          throw new Error("Failed to delete user");
        }
        throw new Error(errorData.error || "Failed to delete user");
      }

      setUsers((prev) => prev.filter((u) => u.id !== user.id));

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const validateCreateForm = (): boolean => {
    const errors: string[] = [];

    if (!createForm.email.trim()) {
      errors.push("Email is required");
    } else if (!/\S+@\S+\.\S+/.test(createForm.email)) {
      errors.push("Please enter a valid email address");
    }

    if (!createForm.name.trim()) {
      errors.push("Name is required");
    }

    if (!createForm.password.trim()) {
      errors.push("Password is required");
    } else if (createForm.password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const resetCreateForm = () => {
    setCreateForm({
      email: "",
      name: "",
      password: "",
    });
    setFormErrors([]);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setUpdateForm({
      name: user.name,
      isActive: user.isActive,
    });
    setFormErrors([]);
    setEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter to show only regular users (not admins)
  const regularUsers = users.filter((user) => user.role === "user");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              User Management
            </h1>
            <p className="text-muted-foreground">
              View and manage registered users
            </p>
          </div>
          {hasPermission("edit_user") && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account
                  </DialogDescription>
                </DialogHeader>

                {formErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {formErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-email">Email</Label>
                    <Input
                      id="create-email"
                      type="email"
                      placeholder="user@example.com"
                      value={createForm.email}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      disabled={formLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-name">Full Name</Label>
                    <Input
                      id="create-name"
                      placeholder="John Doe"
                      value={createForm.name}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      disabled={formLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-password">Password</Label>
                    <Input
                      id="create-password"
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={createForm.password}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      disabled={formLoading}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCreateDialogOpen(false);
                      resetCreateForm();
                    }}
                    disabled={formLoading}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser} disabled={formLoading}>
                    {formLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create User"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}.{" "}
              <Button
                variant="link"
                onClick={fetchUsers}
                className="p-0 h-auto"
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({regularUsers.length})</CardTitle>
            <CardDescription>
              Manage user accounts and their status
            </CardDescription>
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
            ) : regularUsers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <UsersIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No users found</p>
                <p className="text-sm">Create your first user to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regularUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-xs text-primary-foreground font-medium">
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </span>
                          </div>
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
                        <Badge
                          variant={user.isActive ? "default" : "destructive"}
                        >
                          {user.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDate(user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {user.lastLogin
                            ? formatDate(
                                user.lastLogin instanceof Date
                                  ? user.lastLogin.toISOString()
                                  : user.lastLogin
                              )
                            : "Never"}
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
                            {hasPermission("edit_user") && (
                              <DropdownMenuItem
                                onClick={() => openEditDialog(user)}
                              >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {hasPermission("delete_user") && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(user)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user details and status
              </DialogDescription>
            </DialogHeader>

            {formErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {selectedUser && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={updateForm.name || ""}
                    onChange={(e) =>
                      setUpdateForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    disabled={formLoading}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-active"
                    checked={updateForm.isActive ?? true}
                    onCheckedChange={(checked) =>
                      setUpdateForm((prev) => ({
                        ...prev,
                        isActive: !!checked,
                      }))
                    }
                    disabled={formLoading}
                  />
                  <Label htmlFor="edit-active">Active Account</Label>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedUser(null);
                  setUpdateForm({});
                  setFormErrors([]);
                }}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateUser} disabled={formLoading}>
                {formLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
