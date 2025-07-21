import { RequestHandler } from 'express';
import { LoginRequest, LoginResponse, AuthUser } from '../../shared/auth.js';
import { findUserByEmail, updateLastLogin } from '../db/users';
import { comparePassword } from '../utils/password';
import { generateToken, getTokenExpirationTime } from '../utils/jwt';
import { createAuditLog } from '../db/auditLogs';
import { AuthRequest } from '../middleware/auth';

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    updateLastLogin(user.id);

    // Create audit log
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    createAuditLog(
      user.id,
      user.name,
      user.role,
      'login',
      'auth',
      user.id,
      { email: user.email },
      clientIP
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
      createdBy: user.createdBy
    };

    const token = generateToken(authUser);
    const expiresIn = getTokenExpirationTime();

    const response: LoginResponse = {
      user: authUser,
      token,
      expiresIn
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleLogout: RequestHandler = (req: AuthRequest, res) => {
  try {
    if (req.user) {
      // Create audit log
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      createAuditLog(
        req.user.id,
        'Unknown', // We don't have the name in the request
        req.user.role,
        'logout',
        'auth',
        req.user.id,
        { email: req.user.email },
        clientIP
      );
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleVerifyToken: RequestHandler = (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = findUserByEmail(req.user.email);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
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
      createdBy: user.createdBy
    };

    res.json({ user: authUser });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
