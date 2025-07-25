import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Permission, Role } from "@shared/auth";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import AuthFallback from "@/components/AuthFallback";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role | Role[];
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAll?: boolean; // If true, user must have ALL specified permissions
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  fallback,
}: ProtectedRouteProps) {
  const location = useLocation();

  // Try to get auth data, fallback if it fails
  let authData;
  try {
    authData = useAuth();
  } catch (error) {
    console.error("Failed to get auth context:", error);
    return <AuthFallback />;
  }

  const {
    isAuthenticated,
    isLoading,
    user,
    logout,
    hasPermission,
    hasAnyPermission,
    hasRole,
  } = authData;

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole];
    if (!allowedRoles.some((role) => hasRole(role))) {
      return (
        fallback || (
          <AccessDenied
            message="You don't have the required role to access this page."
            onLogout={logout}
          />
        )
      );
    }
  }

  // Check single permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      fallback || (
        <AccessDenied
          message="You don't have the required permission to access this page."
          onLogout={logout}
        />
      )
    );
  }

  // Check multiple permissions requirement
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasRequiredPerms = requireAll
      ? requiredPermissions.every((perm) => hasPermission(perm))
      : hasAnyPermission(requiredPermissions);

    if (!hasRequiredPerms) {
      const message = requireAll
        ? "You don't have all the required permissions to access this page."
        : "You don't have any of the required permissions to access this page.";

      return fallback || <AccessDenied message={message} onLogout={logout} />;
    }
  }

  // All checks passed, render the protected content
  return <>{children}</>;
}

interface AccessDeniedProps {
  message: string;
  onLogout: () => void;
}

function AccessDenied({ message, onLogout }: AccessDeniedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription className="mt-2">{message}</AlertDescription>
        </Alert>

        <div className="mt-6 flex flex-col space-y-3">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
          >
            Go Back
          </Button>
          <Button variant="destructive" onClick={onLogout} className="w-full">
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

// Convenience wrapper components for common use cases
export function MainAdminRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRole="main-admin">{children}</ProtectedRoute>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole={["main-admin", "sub-admin"]}>
      {children}
    </ProtectedRoute>
  );
}

export function AuthenticatedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
