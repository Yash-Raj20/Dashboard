import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { findUserById } from '../db/users';
import { Permission, hasPermission, Role } from '../../shared/auth.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    permissions: Permission[];
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    const user = findUserById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(roles: Role | Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!hasPermission(req.user.permissions, permission)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    next();
  };
}

export function requireAnyPermission(permissions: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasAnyPerm = permissions.some(permission => 
      hasPermission(req.user!.permissions, permission)
    );

    if (!hasAnyPerm) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    next();
  };
}
