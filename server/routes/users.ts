import { RequestHandler } from "express";
import {
  CreateSubAdminRequest,
  UpdateSubAdminRequest,
  CreateUserRequest,
  UpdateUserRequest,
  ROLE_PERMISSIONS,
} from "../../shared/auth.js";
import {
  getAllUsers,
  getSubAdmins,
  createUser,
  updateUser,
  deleteUser,
  findUserByEmail,
  findUserById,
} from "../db/users";
import { hashPassword, validatePassword } from "../utils/password";
import { createAuditLog } from "../db/auditLogs";
import { triggerNotification } from "./notifications";
import { AuthRequest } from "../middleware/auth";

export const handleGetUsers: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const users = await getAllUsers();
    res.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetSubAdmins: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const subAdmins = await getSubAdmins();
    res.json({ subAdmins });
  } catch (error) {
    console.error("Get sub-admins error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleCreateSubAdmin: RequestHandler = async (
  req: AuthRequest,
  res,
) => {
  try {
    const { email, name, password, permissions }: CreateSubAdminRequest =
      req.body;

    if (!email || !name || !password || !permissions) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: "Password validation failed",
        details: passwordValidation.errors,
      });
    }

    // Check if user already exists
    if (await findUserByEmail(email)) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    // Validate permissions
    const validPermissions = ROLE_PERMISSIONS["sub-admin"];
    const invalidPerms = permissions.filter(
      (perm) => !validPermissions.includes(perm),
    );
    if (invalidPerms.length > 0) {
      return res.status(400).json({
        error: "Invalid permissions for sub-admin role",
        details: invalidPerms,
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create sub-admin
    const newSubAdmin = await createUser({
      email,
      name,
      password: hashedPassword,
      role: "sub-admin",
      permissions,
      isActive: true,
      createdBy: req.user!.id,
    });

    // Create audit log
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";
    await createAuditLog(
      req.user!.id,
      "Unknown", // We need to get the user name separately
      req.user!.role,
      "create_sub_admin",
      "user",
      newSubAdmin!.id,
      { email, name, permissions },
      clientIP,
    );

    res.status(201).json({ subAdmin: newSubAdmin });
  } catch (error) {
    console.error("Create sub-admin error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateSubAdmin: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates: UpdateSubAdminRequest = req.body;

    const existingUser = await findUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "Sub-admin not found" });
    }

    if (existingUser.role !== "sub-admin") {
      return res.status(400).json({ error: "User is not a sub-admin" });
    }

    // Validate permissions if provided
    if (updates.permissions) {
      const validPermissions = ROLE_PERMISSIONS["sub-admin"];
      const invalidPerms = updates.permissions.filter(
        (perm) => !validPermissions.includes(perm),
      );
      if (invalidPerms.length > 0) {
        return res.status(400).json({
          error: "Invalid permissions for sub-admin role",
          details: invalidPerms,
        });
      }
    }

    const updatedUser = await updateUser(id, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: "Sub-admin not found" });
    }

    // Create audit log
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";
    await createAuditLog(
      req.user!.id,
      "Unknown",
      req.user!.role,
      "update_sub_admin",
      "user",
      id,
      updates,
      clientIP,
    );

    res.json({ subAdmin: updatedUser });
  } catch (error) {
    console.error("Update sub-admin error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeleteSubAdmin: RequestHandler = (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const existingUser = findUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "Sub-admin not found" });
    }

    if (existingUser.role !== "sub-admin") {
      return res.status(400).json({ error: "User is not a sub-admin" });
    }

    const deleted = deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ error: "Sub-admin not found" });
    }

    // Create audit log
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";
    createAuditLog(
      req.user!.id,
      "Unknown",
      req.user!.role,
      "delete_sub_admin",
      "user",
      id,
      { email: existingUser.email, name: existingUser.name },
      clientIP,
    );

    res.json({ message: "Sub-admin deleted successfully" });
  } catch (error) {
    console.error("Delete sub-admin error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleCreateUser: RequestHandler = async (
  req: AuthRequest,
  res,
) => {
  try {
    const { email, name, password }: CreateUserRequest = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: "Password validation failed",
        details: passwordValidation.errors,
      });
    }

    // Check if user already exists
    if (findUserByEmail(email)) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = createUser({
      email,
      name,
      password: hashedPassword,
      role: "user",
      permissions: ROLE_PERMISSIONS["user"],
      isActive: true,
      createdBy: req.user!.id,
    });

    // Create audit log
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";
    createAuditLog(
      req.user!.id,
      "Unknown",
      req.user!.role,
      "create_user",
      "user",
      newUser.id,
      { email, name },
      clientIP,
    );

    res.status(201).json({ user: newUser });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateUser: RequestHandler = (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates: UpdateUserRequest = req.body;

    const existingUser = findUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (existingUser.role !== "user") {
      return res.status(400).json({ error: "Target is not a regular user" });
    }

    const updatedUser = updateUser(id, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create audit log
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";
    createAuditLog(
      req.user!.id,
      "Unknown",
      req.user!.role,
      "update_user",
      "user",
      id,
      updates,
      clientIP,
    );

    res.json({ user: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeleteUser: RequestHandler = (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const existingUser = findUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (existingUser.role !== "user") {
      return res.status(400).json({ error: "Target is not a regular user" });
    }

    const deleted = deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create audit log
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";
    createAuditLog(
      req.user!.id,
      "Unknown",
      req.user!.role,
      "delete_user",
      "user",
      id,
      { email: existingUser.email, name: existingUser.name },
      clientIP,
    );

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
