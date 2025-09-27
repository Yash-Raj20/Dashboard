import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { findUserById } from "../db/users";
import { Permission, Role, hasPermission } from "../../shared/auth.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    permissions: Permission[];
  };
}

// ✅ Authenticate using JWT
export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = verifyToken(token);

    if (!decoded?.userId) {
      return res.status(403).json({ error: "Invalid token payload" });
    }

    const user = await findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: "User account is inactive" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
    };

    next();
  } catch (error: any) {
    console.error("Auth error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please log in again." });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ error: "Invalid token format" });
    }

    return res.status(500).json({ error: "Authentication failed" });
  }
}

export function requireRole(roles: Role | Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient role permission" });
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

    const hasAny = permissions.some((perm) =>
      hasPermission(req.user!.permissions, perm),
    );

    if (!hasAny) {
      return res.status(403).json({ error: "At least one permission required" });
    }

    next();
  };
}
