import {
  User as UserInterface,
  Role,
  ROLE_PERMISSIONS,
} from "../../shared/auth.js";
import { User, IUser } from "./models/User.js";
import { hashPassword } from "../utils/password.js";

// Initialize with a default main admin
export async function initializeDefaultAdmin() {
  const existingAdmin = await User.findOne({ role: "main-admin" });

  if (!existingAdmin) {
    const defaultAdmin = new User({
      email: "ratnesh@gmail.com",
      name: "Main Administrator",
      password: await hashPassword("Admin@123"),
      role: "main-admin" as Role,
      permissions: ROLE_PERMISSIONS["main-admin"],
      isActive: true,
      lastLogin: undefined,
      createdBy: undefined,
    });

    await defaultAdmin.save();
    console.log("✅ Default admin created (ratnesh@gmail.com / Admin@123)");

    // Create a test notification
    try {
      const { createNotification } = await import("./notifications.js");
      await createNotification({
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
      console.log("✅ Test notification created");
    } catch (error) {
      console.error("❌ Failed to create test notification:", error);
    }
  }
}

export async function findUserByEmail(
  email: string
): Promise<(UserInterface & { password: string }) | null> {
  const user = await User.findOne({ email: email.toLowerCase() }).lean();
  if (!user) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    password: user.password,
    role: user.role,
    permissions: user.permissions,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdBy: user.createdBy,
  };
}

export async function findUserById(
  id: string
): Promise<(UserInterface & { password: string }) | null> {
  const user = await User.findById(id).lean();
  if (!user) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    password: user.password,
    role: user.role,
    permissions: user.permissions,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdBy: user.createdBy,
  };
}

export async function getAllUsers(): Promise<UserInterface[]> {
  const users = await User.find({}, { password: 0 }).lean();
  return users.map((user) => ({
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    permissions: user.permissions,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdBy: user.createdBy,
  }));
}

export async function getSubAdmins(): Promise<UserInterface[]> {
  const users = await User.find({ role: "sub-admin" }, { password: 0 }).lean();
  return users.map((user) => ({
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    permissions: user.permissions,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdBy: user.createdBy,
  }));
}

export async function createUser(
  userData: Omit<
    UserInterface & { password: string },
    "id" | "createdAt" | "updatedAt"
  >
): Promise<UserInterface | null> {
  const newUser = new User({
    ...userData,
    email: userData.email.toLowerCase(),
  });

  const savedUser = await newUser.save();
  return {
    id: savedUser._id.toString(),
    email: savedUser.email,
    name: savedUser.name,
    role: savedUser.role,
    permissions: savedUser.permissions,
    createdAt: savedUser.createdAt,
    updatedAt: savedUser.updatedAt,
    isActive: savedUser.isActive,
    lastLogin: savedUser.lastLogin,
    createdBy: savedUser.createdBy,
  };
}

export async function updateUser(
  id: string,
  updates: Partial<UserInterface>
): Promise<UserInterface | null> {
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { ...updates, updatedAt: new Date() },
    { new: true, select: { password: 0 } }
  ).lean();

  if (!updatedUser) return null;

  return {
    id: updatedUser._id.toString(),
    email: updatedUser.email,
    name: updatedUser.name,
    role: updatedUser.role,
    permissions: updatedUser.permissions,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
    isActive: updatedUser.isActive,
    lastLogin: updatedUser.lastLogin,
    createdBy: updatedUser.createdBy,
  };
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await User.findByIdAndDelete(id);
  return !!result;
}

export async function updateLastLogin(id: string): Promise<void> {
  await User.findByIdAndUpdate(id, {
    lastLogin: new Date(),
    updatedAt: new Date(),
  });
}