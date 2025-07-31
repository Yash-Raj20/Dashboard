/**
 * Shared authentication and role types between client and server
 */

export type Role = "main-admin" | "sub-admin" | "user";

export type Permission =
  | "create_sub_admin"
  | "edit_sub_admin"
  | "delete_sub_admin"
  | "view_all_users"
  | "edit_user"
  | "delete_user"
  | "view_analytics"
  | "view_audit_logs"
  | "manage_notifications"
  | "view_dashboard"
  | "edit_profile";

// Base User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLogin?: Date;
  createdBy?: string; // ID of admin who created this user
}

// AuthUser returned after login, with date strings
export interface AuthUser extends Omit<User, "createdAt" | "updatedAt" | "lastLogin"> {
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

// Request interfaces
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
  expiresIn: number;
}

export interface CreateSubAdminRequest {
  email: string;
  name: string;
  password: string;
  permissions: Permission[];
}

export interface UpdateSubAdminRequest {
  name?: string;
  permissions?: Permission[];
  isActive?: boolean;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role?: "user"; // Explicitly allow only 'user' role
}

export interface UpdateUserRequest {
  name?: string;
  isActive?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Audit logs
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  target?: string;
  targetId?: string;
  details?: any;
  timestamp: Date;
  ipAddress?: string;
}

export interface AuthAuditLog extends Omit<AuditLog, "timestamp"> {
  timestamp: string;
}

// Dashboard metrics
export interface DashboardStats {
  totalUsers: number;
  totalSubAdmins: number;
  activeUsers: number;
  todayLogins: number;
  recentActions: AuthAuditLog[];
}

// Role → Permissions mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  "main-admin": [
    "create_sub_admin",
    "edit_sub_admin",
    "delete_sub_admin",
    "view_all_users",
    "edit_user",
    "delete_user",
    "view_analytics",
    "view_audit_logs",
    "manage_notifications",
    "view_dashboard",
    "edit_profile",
  ],
  "sub-admin": [
    "view_all_users",
    "edit_user",
    "view_analytics",
    "view_dashboard",
    "edit_profile",
  ],
  user: ["view_dashboard", "edit_profile"],
};

// Permission checking helpers
export function hasPermission(
  userPermissions: Permission[] | undefined,
  requiredPermission: Permission,
): boolean {
  return userPermissions?.includes(requiredPermission) ?? false;
}

export function hasAnyPermission(
  userPermissions: Permission[] | undefined,
  requiredPermissions: Permission[],
): boolean {
  if (!userPermissions) return false;
  return requiredPermissions.some((perm) => userPermissions.includes(perm));
}

export function hasAllPermissions(
  userPermissions: Permission[] | undefined,
  requiredPermissions: Permission[],
): boolean {
  if (!userPermissions) return false;
  return requiredPermissions.every((perm) => userPermissions.includes(perm));
}