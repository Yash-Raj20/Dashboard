/**
 * Shared authentication and role types between client and server
 */

export type Role = 'main-admin' | 'sub-admin' | 'user';

export type Permission = 
  | 'create_sub_admin'
  | 'edit_sub_admin'
  | 'delete_sub_admin'
  | 'view_all_users'
  | 'edit_user'
  | 'delete_user'
  | 'view_analytics'
  | 'view_audit_logs'
  | 'manage_notifications'
  | 'view_dashboard'
  | 'edit_profile';

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
  createdBy?: string; // ID of the admin who created this user
}

export interface AuthUser extends Omit<User, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

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
  role?: 'user';
}

export interface UpdateUserRequest {
  name?: string;
  isActive?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

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

export interface AuthAuditLog extends Omit<AuditLog, 'timestamp'> {
  timestamp: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalSubAdmins: number;
  activeUsers: number;
  todayLogins: number;
  recentActions: AuthAuditLog[];
}

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  'main-admin': [
    'create_sub_admin',
    'edit_sub_admin', 
    'delete_sub_admin',
    'view_all_users',
    'edit_user',
    'delete_user',
    'view_analytics',
    'view_audit_logs',
    'manage_notifications',
    'view_dashboard',
    'edit_profile'
  ],
  'sub-admin': [
    'view_all_users',
    'edit_user',
    'view_analytics',
    'view_dashboard',
    'edit_profile'
  ],
  'user': [
    'view_dashboard',
    'edit_profile'
  ]
};

export function hasPermission(userPermissions: Permission[], requiredPermission: Permission): boolean {
  return userPermissions.includes(requiredPermission);
}

export function hasAnyPermission(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

export function hasAllPermissions(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}
