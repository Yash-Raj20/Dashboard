import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { findUserById } from "../db/users";
import { Permission, hasPermission, Role } from "../../shared/auth.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    permissions: Permission[];
  };
}

// Async wrapper to properly handle async middleware in Express
function asyncHandler(fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

async function authenticateTokenAsync(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      console.error("Invalid token payload:", decoded);
      return res.status(403).json({ error: "Invalid token payload" });
    }

    const user = await findUserById(decoded.userId);

    if (!user) {
      console.error("User not found for ID:", decoded.userId);
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.isActive) {
      console.error("Inactive user attempting access:", user.email);
      return res.status(401).json({ error: "User account is inactive" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    if (error instanceof Error && error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Token expired. Please log in again." });
    } else if (error instanceof Error && error.name === "JsonWebTokenError") {
      return res.status(403).json({ error: "Invalid token format" });
    }
    return res.status(403).json({ error: "Authentication failed" });
  }
}

export const authenticateToken = asyncHandler(authenticateTokenAsync);

export function requireRole(roles: Role | Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!hasPermission(req.user.permissions, permission)) {
      return res.status(403).json({ error: "Permission denied" });
    }

    next();
  };
}

export function requireAnyPermission(permissions: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const hasAnyPerm = permissions.some((permission) =>
      hasPermission(req.user!.permissions, permission),
    );

    if (!hasAnyPerm) {
      return res.status(403).json({ error: "Permission denied" });
    }

    next();
  };
}
