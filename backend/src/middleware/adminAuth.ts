import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/connection';

export const JWT_SECRET = process.env.JWT_SECRET || 'crm_luxury_fashion_secret_key_2026';

export interface AdminPayload {
  id: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

export function generateAdminToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload;
  } catch {
    return null;
  }
}

/**
 * Middleware that strictly protects CRM admin routes.
 * Accepts Bearer token in Authorization header or admin_token cookie.
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  if (!token) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication required. Please log in to access the CRM administration portal.',
    });
    return;
  }

  const payload = verifyAdminToken(token);
  if (!payload) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired session token. Please log in again.',
    });
    return;
  }

  // Ensure admin still exists in SQLite database
  const db = getDb();
  const admin = db.prepare('SELECT id, username FROM admins WHERE id = ?').get(payload.id) as AdminPayload | undefined;
  if (!admin) {
    res.status(401).json({
      status: 'error',
      message: 'Admin account not found.',
    });
    return;
  }

  req.admin = { id: admin.id, username: admin.username };
  next();
}
