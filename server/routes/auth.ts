import { RequestHandler } from "express";
import { LoginRequest, LoginResponse, AuthUser } from "../../shared/auth.js";
import { findUserByEmail, updateLastLogin } from "../db/users";
import { comparePassword } from "../utils/password";
import { generateToken, getTokenExpirationTime } from "../utils/jwt";
import { createAuditLog } from "../db/auditLogs";
import { AuthRequest } from "../middleware/auth";

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    console.log(`Login attempt for email: ${email}`);

    if (!email || !password) {
      console.log("Login failed: Missing email or password");
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      console.log(`Login failed: User not found for email: ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      console.log(`Login failed: Account deactivated for email: ${email}`);
      return res.status(401).json({ error: "Account is deactivated" });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      console.log(`Login failed: Invalid password for email: ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log(`Login successful for email: ${email}`);

    // Update last login
    await updateLastLogin(user.id);

    // Create audit log
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";
    await createAuditLog(
      user.id,
      user.name,
      user.role,
      "login",
      "auth",
      user.id,
      { email: user.email },
      clientIP,
    );

    // Generate JWT token
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
      createdBy: user.createdBy,
    };

    const token = generateToken(authUser);
    const expiresIn = getTokenExpirationTime();

    const response: LoginResponse = {
      user: authUser,
      token,
      expiresIn,
    };

    res.json(response);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleLogout: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (req.user) {
      // Create audit log
      const clientIP = req.ip || req.connection.remoteAddress || "unknown";
      await createAuditLog(
        req.user.id,
        "Unknown", // We don't have the name in the request
        req.user.role,
        "logout",
        "auth",
        req.user.id,
        { email: req.user.email },
        clientIP,
      );
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleProfile: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = await findUserByEmail(req.user.email);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid or inactive user" });
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
      createdBy: user.createdBy,
    };

    res.json({ user: authUser });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleRefreshToken: RequestHandler = async (
  req: AuthRequest,
  res,
) => {
  // For now, just return the same token logic as handleProfile
  await handleProfile(req, res);
};
