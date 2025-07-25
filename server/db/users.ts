import { User as UserInterface, Role, ROLE_PERMISSIONS } from "../../shared/auth.js";
import { User, IUser } from "./models/User.js";
import { hashPassword } from "../utils/password.js";
import { withDatabase } from "./adapter.js";
import * as memoryUsers from "./memory/users.js";

// Initialize with a default main admin
export async function initializeDefaultAdmin() {
  return withDatabase(
    async () => {
      const existingAdmin = await User.findOne({ role: "main-admin" });

      if (!existingAdmin) {
        const defaultAdmin = new User({
          email: "admin@example.com",
          name: "Main Administrator",
          password: await hashPassword("Admin123!"),
          role: "main-admin" as Role,
          permissions: ROLE_PERMISSIONS["main-admin"],
          isActive: true,
          lastLogin: undefined,
          createdBy: undefined,
        });

        await defaultAdmin.save();
        console.log("Default admin created with email: admin@example.com and password: Admin123!");
      }
    },
    () => memoryUsers.initializeDefaultAdminMemory()
  );
}

export async function findUserByEmail(
  email: string,
): Promise<(UserInterface & { password: string }) | null> {
  return withDatabase(
    async () => {
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
    },
    () => memoryUsers.findUserByEmailMemory(email)
  );
}

export async function findUserById(
  id: string,
): Promise<(UserInterface & { password: string }) | null> {
  return withDatabase(
    async () => {
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
    },
    () => memoryUsers.findUserByIdMemory(id)
  );
}

export async function getAllUsers(): Promise<UserInterface[]> {
  return withDatabase(
    async () => {
      const users = await User.find({}, { password: 0 }).lean();

      return users.map(user => ({
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
    },
    () => memoryUsers.getAllUsersMemory()
  );
}

export async function getSubAdmins(): Promise<UserInterface[]> {
  return withDatabase(
    async () => {
      const users = await User.find({ role: "sub-admin" }, { password: 0 }).lean();

      return users.map(user => ({
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
    },
    () => memoryUsers.getSubAdminsMemory()
  );
}

export async function createUser(
  userData: Omit<UserInterface & { password: string }, "id" | "createdAt" | "updatedAt">,
): Promise<UserInterface | null> {
  return withDatabase(
    async () => {
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
    },
    () => memoryUsers.createUserMemory(userData)
  );
}

export async function updateUser(id: string, updates: Partial<UserInterface>): Promise<UserInterface | null> {
  try {
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
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

export async function updateLastLogin(id: string): Promise<void> {
  return withDatabase(
    async () => {
      await User.findByIdAndUpdate(
        id,
        {
          lastLogin: new Date(),
          updatedAt: new Date()
        }
      );
    },
    () => memoryUsers.updateLastLoginMemory(id)
  );
}
