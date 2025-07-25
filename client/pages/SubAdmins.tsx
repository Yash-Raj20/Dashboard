import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  User,
  CreateSubAdminRequest,
  UpdateSubAdminRequest,
  Permission,
  ROLE_PERMISSIONS,
} from "@shared/auth";
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
import { Textarea } from "@/components/ui/textarea";
import {
  UserPlus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Shield,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SubAdmins() {
  const { hasPermission, logout } = useAuth();
  const { toast } = useToast();
  const [subAdmins, setSubAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState<User | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateSubAdminRequest>({
    email: "",
    name: "",
    password: "",
    permissions: [],
  });
  const [updateForm, setUpdateForm] = useState<UpdateSubAdminRequest>({});
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  useEffect(() => {
    fetchSubAdmins();
  }, []);

  const fetchSubAdmins = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/sub-admins", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Authentication failed - clear tokens and redirect to login
          localStorage.removeItem("auth_token");
          logout();
          throw new Error("Session expired. Please log in again.");
        }
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to fetch sub-admins: ${response.status}`);
      }

      const data = await response.json();
      setSubAdmins(data.subAdmins);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubAdmin = async () => {
    if (!validateCreateForm()) return;

    try {
      setFormLoading(true);
      setFormErrors([]);

      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/sub-admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        // Handle validation errors with details
        if (data.details && Array.isArray(data.details)) {
          setFormErrors(data.details);
          return;
        }
        throw new Error(data.error || "Failed to create sub-admin");
      }
      setSubAdmins((prev) => [...prev, data.subAdmin]);
      setCreateDialogOpen(false);
      resetCreateForm();

      toast({
        title: "Success",
        description: "Sub-admin created successfully",
      });
    } catch (err) {
      setFormErrors([err instanceof Error ? err.message : "An error occurred"]);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateSubAdmin = async () => {
    if (!selectedSubAdmin) return;

    try {
      setFormLoading(true);
      setFormErrors([]);

      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/sub-admins/${selectedSubAdmin.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateForm),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        // Handle validation errors with details
        if (data.details && Array.isArray(data.details)) {
          setFormErrors(data.details);
          return;
        }
        throw new Error(data.error || "Failed to update sub-admin");
      }
      setSubAdmins((prev) =>
        prev.map((admin) =>
          admin.id === selectedSubAdmin.id ? data.subAdmin : admin,
        ),
      );
      setEditDialogOpen(false);
      setSelectedSubAdmin(null);
      setUpdateForm({});

      toast({
        title: "Success",
        description: "Sub-admin updated successfully",
      });
    } catch (err) {
      setFormErrors([err instanceof Error ? err.message : "An error occurred"]);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSubAdmin = async (subAdmin: User) => {
    if (
      !confirm(`Are you sure you want to delete sub-admin "${subAdmin.name}"?`)
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/sub-admins/${subAdmin.id}`, {
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
          throw new Error("Failed to delete sub-admin");
        }
        throw new Error(errorData.error || "Failed to delete sub-admin");
      }

      setSubAdmins((prev) => prev.filter((admin) => admin.id !== subAdmin.id));

      toast({
        title: "Success",
        description: "Sub-admin deleted successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to delete sub-admin",
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

    if (createForm.permissions.length === 0) {
      errors.push("At least one permission must be selected");
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const resetCreateForm = () => {
    setCreateForm({
      email: "",
      name: "",
      password: "",
      permissions: [],
    });
    setFormErrors([]);
  };

  const openEditDialog = (subAdmin: User) => {
    setSelectedSubAdmin(subAdmin);
    setUpdateForm({
      name: subAdmin.name,
      permissions: subAdmin.permissions,
      isActive: subAdmin.isActive,
    });
    setFormErrors([]);
    setEditDialogOpen(true);
  };

  const handlePermissionToggle = (
    permission: Permission,
    isCreate: boolean = true,
  ) => {
    if (isCreate) {
      setCreateForm((prev) => ({
        ...prev,
        permissions: prev.permissions.includes(permission)
          ? prev.permissions.filter((p) => p !== permission)
          : [...prev.permissions, permission],
      }));
    } else {
      setUpdateForm((prev) => ({
        ...prev,
        permissions: (prev.permissions || []).includes(permission)
          ? (prev.permissions || []).filter((p) => p !== permission)
          : [...(prev.permissions || []), permission],
      }));
    }
  };

  const availablePermissions = ROLE_PERMISSIONS["sub-admin"];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Sub-Admin Management
            </h1>
            <p className="text-muted-foreground">
              Create and manage sub-administrators with specific permissions
            </p>
          </div>
          {hasPermission("create_sub_admin") && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Sub-Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Sub-Admin</DialogTitle>
                  <DialogDescription>
                    Create a new sub-administrator with specific permissions
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="create-email">Email</Label>
                      <Input
                        id="create-email"
                        type="email"
                        placeholder="admin@example.com"
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

                  <div className="space-y-3">
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {availablePermissions.map((permission) => (
                        <div
                          key={permission}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`create-${permission}`}
                            checked={createForm.permissions.includes(
                              permission,
                            )}
                            onCheckedChange={() =>
                              handlePermissionToggle(permission, true)
                            }
                            disabled={formLoading}
                          />
                          <Label
                            htmlFor={`create-${permission}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {permission
                              .replace("_", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </div>
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
                  <Button onClick={handleCreateSubAdmin} disabled={formLoading}>
                    {formLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Sub-Admin"
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
                onClick={fetchSubAdmins}
                className="p-0 h-auto"
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Sub-Admins Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sub-Administrators ({subAdmins.length})</CardTitle>
            <CardDescription>
              Manage sub-administrators and their permissions
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
            ) : subAdmins.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No sub-administrators found</p>
                <p className="text-sm">
                  Create your first sub-admin to get started
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sub-Admin</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subAdmins.map((subAdmin) => (
                    <TableRow key={subAdmin.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-xs text-primary-foreground font-medium">
                              {subAdmin.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </span>
                          </div>
                          <span>{subAdmin.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{subAdmin.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            subAdmin.isActive ? "default" : "destructive"
                          }
                        >
                          {subAdmin.isActive ? (
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
                        <span className="text-sm text-muted-foreground">
                          {subAdmin.permissions.length} permissions
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDate(subAdmin.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {hasPermission("edit_sub_admin") && (
                              <DropdownMenuItem
                                onClick={() => openEditDialog(subAdmin)}
                              >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {hasPermission("delete_sub_admin") && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteSubAdmin(subAdmin)}
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Sub-Admin</DialogTitle>
              <DialogDescription>
                Update sub-administrator details and permissions
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

            {selectedSubAdmin && (
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

                <div className="space-y-3">
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {availablePermissions.map((permission) => (
                      <div
                        key={permission}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`edit-${permission}`}
                          checked={(updateForm.permissions || []).includes(
                            permission,
                          )}
                          onCheckedChange={() =>
                            handlePermissionToggle(permission, false)
                          }
                          disabled={formLoading}
                        />
                        <Label
                          htmlFor={`edit-${permission}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {permission
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedSubAdmin(null);
                  setUpdateForm({});
                  setFormErrors([]);
                }}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateSubAdmin} disabled={formLoading}>
                {formLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Sub-Admin"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
