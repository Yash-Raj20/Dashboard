import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { AuthUser } from "../../shared/auth.js";

// Validate and load secret
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  throw new Error("❌ JWT_SECRET is not defined in environment variables.");
}

export interface JWTPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate a signed JWT for the given user.
 */
export function generateToken(user: AuthUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  };

  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify a JWT and return the payload or throw a standardized error.
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    if (!decoded || !decoded.userId || !decoded.email || !decoded.role) {
      throw new Error("Token payload is malformed.");
    }

    return decoded;
  } catch (err) {
    throw new Error("⛔ Invalid or expired token.");
  }
}

/**
 * Get expiration time in seconds (defaults to 7 days).
 */
export function getTokenExpirationTime(): number {
  return 7 * 24 * 60 * 60;
}