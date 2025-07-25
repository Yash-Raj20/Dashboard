import { User as UserInterface, Role, ROLE_PERMISSIONS } from "../../../shared/auth.js";
import { hashPassword } from "../../utils/password.js";

// In-memory users storage
const memoryUsers: (UserInterface & { password: string })[] = [];

export async function initializeDefaultAdminMemory() {
  if (memoryUsers.length === 0) {
    const defaultAdmin = {
      id: "admin-1",
      email: "admin@example.com",
      name: "Main Administrator",
      password: await hashPassword("Admin123!"),
      role: "main-admin" as Role,
      permissions: ROLE_PERMISSIONS["main-admin"],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      lastLogin: undefined,
      createdBy: undefined,
    };

    memoryUsers.push(defaultAdmin);

    // Create a test sub-admin for debugging
    const testSubAdmin = {
      id: "sub-admin-1",
      email: "subadmin@example.com",
      name: "Test Sub-Administrator",
      password: await hashPassword("SubAdmin123!"),
      role: "sub-admin" as Role,
      permissions: ROLE_PERMISSIONS["sub-admin"],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      lastLogin: undefined,
      createdBy: "admin-1",
    };
    memoryUsers.push(testSubAdmin);

    console.log("Default admin created with email: admin@example.com and password: Admin123!");
    console.log("Test sub-admin created with email: subadmin@example.com and password: SubAdmin123!");

    // Create a test notification for debugging
    try {
      const { createNotificationMemory } = await import("./notifications.js");
      createNotificationMemory({
        targetRole: "main-admin",
        fromUserId: "system",
        fromUserName: "System",
        fromUserRole: "main-admin",
        type: "info",
        title: "Welcome to Admin Dashboard",
        message: "Your admin dashboard is now ready to use!",
        action: "system_startup",
        priority: "medium",
      });
      console.log("✅ Test notification created in memory");
    } catch (error) {
      console.error("❌ Failed to create test notification:", error);
    }

    // Create test audit logs for debugging
    try {
      const { createAuditLogMemory } = await import("./auditLogs.js");
      createAuditLogMemory("admin-1", "Main Administrator", "main-admin", "system_startup", "system", "admin-1", { startup: true }, "127.0.0.1");
      createAuditLogMemory("admin-1", "Main Administrator", "main-admin", "create_admin", "user", "admin-1", { email: "admin@example.com" }, "127.0.0.1");
      console.log("✅ Test audit logs created in memory");
    } catch (error) {
      console.error("❌ Failed to create test audit logs:", error);
    }
  }
}

export function findUserByEmailMemory(email: string): (UserInterface & { password: string }) | null {
  return memoryUsers.find((user) => user.email === email) || null;
}

export function findUserByIdMemory(id: string): (UserInterface & { password: string }) | null {
  return memoryUsers.find((user) => user.id === id) || null;
}

export function getAllUsersMemory(): UserInterface[] {
  return memoryUsers.map(({ password, ...user }) => user);
}

export function getSubAdminsMemory(): UserInterface[] {
  return memoryUsers
    .filter((user) => user.role === "sub-admin")
    .map(({ password, ...user }) => user);
}

export function createUserMemory(
  userData: Omit<UserInterface & { password: string }, "id" | "createdAt" | "updatedAt">,
): UserInterface | null {
  const newUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryUsers.push(newUser);

  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

export function updateUserMemory(id: string, updates: Partial<UserInterface>): UserInterface | null {
  const userIndex = memoryUsers.findIndex((user) => user.id === id);
  if (userIndex === -1) return null;

  memoryUsers[userIndex] = {
    ...memoryUsers[userIndex],
    ...updates,
    updatedAt: new Date(),
  };

  const { password, ...userWithoutPassword } = memoryUsers[userIndex];
  return userWithoutPassword;
}

export function deleteUserMemory(id: string): boolean {
  const userIndex = memoryUsers.findIndex((user) => user.id === id);
  if (userIndex === -1) return false;

  memoryUsers.splice(userIndex, 1);
  return true;
}

export function updateLastLoginMemory(id: string): void {
  const userIndex = memoryUsers.findIndex((user) => user.id === id);
  if (userIndex !== -1) {
    memoryUsers[userIndex].lastLogin = new Date();
    memoryUsers[userIndex].updatedAt = new Date();
  }
}
