import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/connection';
import { generateAdminToken } from '../middleware/adminAuth';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
  getProductById,
} from '../services/catalogService';

export function handleAdminLogin(req: Request, res: Response): void {
  const { username, password } = req.body;
  const db = getDb();

  const admin = db.prepare('SELECT * FROM admins WHERE LOWER(username) = LOWER(?)').get(username) as {
    id: string;
    username: string;
    password_hash: string;
  } | undefined;

  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid administrative username or password',
    });
    return;
  }

  const token = generateAdminToken({ id: admin.id, username: admin.username });

  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    status: 'success',
    data: {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    },
  });
}

export function handleAdminMe(req: Request, res: Response): void {
  res.status(200).json({
    status: 'success',
    data: {
      admin: req.admin,
    },
  });
}

export function handleAdminLogout(_req: Request, res: Response): void {
  res.clearCookie('admin_token');
  res.status(200).json({
    status: 'success',
    message: 'Successfully logged out',
  });
}

// ----------------------------------------------------
// CRM Products CRUD Controllers
// ----------------------------------------------------

export function handleGetAdminProducts(req: Request, res: Response): void {
  const inStockParam = req.query.inStock;
  let inStock: boolean | undefined = undefined;
  if (inStockParam === 'true') inStock = true;
  else if (inStockParam === 'false') inStock = false;

  const result = getAdminProducts({
    search: req.query.search as string | undefined,
    subcategory: req.query.subcategory as string | undefined,
    inStock,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });

  res.status(200).json(result);
}

export function handleCreateProduct(req: Request, res: Response): void {
  try {
    const product = createProduct(req.body);
    res.status(201).json({
      status: 'success',
      data: product,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create product';
    res.status(400).json({
      status: 'error',
      message: msg,
    });
  }
}

export function handleUpdateProduct(req: Request, res: Response): void {
  const { id } = req.params;
  const existing = getProductById(id);
  if (!existing) {
    res.status(404).json({
      status: 'error',
      message: `Product with ID "${id}" does not exist`,
    });
    return;
  }

  const updated = updateProduct(id, req.body);
  res.status(200).json({
    status: 'success',
    data: updated,
  });
}

export function handleDeleteProduct(req: Request, res: Response): void {
  const { id } = req.params;
  const existing = getProductById(id);
  if (!existing) {
    res.status(404).json({
      status: 'error',
      message: `Product with ID "${id}" does not exist`,
    });
    return;
  }

  deleteProduct(id);
  res.status(200).json({
    status: 'success',
    message: `Product "${existing.title}" (${id}) successfully removed from catalog`,
  });
}

// ----------------------------------------------------
// Whitelist Management Controllers
// ----------------------------------------------------

export function handleGetWhitelist(_req: Request, res: Response): void {
  const db = getDb();
  const domains = db.prepare('SELECT * FROM whitelist_domains ORDER BY created_at DESC').all();
  res.status(200).json({
    status: 'success',
    data: domains,
  });
}

export function handleAddWhitelist(req: Request, res: Response): void {
  const { domain } = req.body;
  const normalized = domain.toLowerCase().trim();
  const db = getDb();
  const id = `wl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO whitelist_domains (id, domain, is_active, created_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(domain) DO UPDATE SET is_active = 1
  `).run(id, normalized, now);

  const record = db.prepare('SELECT * FROM whitelist_domains WHERE domain = ?').get(normalized);

  res.status(201).json({
    status: 'success',
    data: record,
  });
}

export function handleDeleteWhitelist(req: Request, res: Response): void {
  const { id } = req.params;
  const db = getDb();
  const resDel = db.prepare('DELETE FROM whitelist_domains WHERE id = ? OR domain = ?').run(id, id);

  if (resDel.changes === 0) {
    res.status(404).json({
      status: 'error',
      message: `Domain record "${id}" not found`,
    });
    return;
  }

  res.status(200).json({
    status: 'success',
    message: `Domain "${id}" removed from whitelist`,
  });
}

// ----------------------------------------------------
// Analytics & Performance Metrics Controllers
// ----------------------------------------------------

export function handleGetAnalytics(_req: Request, res: Response): void {
  const db = getDb();

  const totalProducts = (db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }).count;
  const totalClicks = (db.prepare('SELECT COUNT(*) as count FROM affiliate_clicks').get() as { count: number }).count;
  const activeRetailers = (db.prepare('SELECT COUNT(*) as count FROM retailers WHERE is_active = 1').get() as { count: number }).count;
  const whitelistedDomains = (db.prepare('SELECT COUNT(*) as count FROM whitelist_domains WHERE is_active = 1').get() as { count: number }).count;

  const topProducts = db.prepare(`
    SELECT 
      p.id, 
      p.title, 
      p.retailer_name,
      p.price,
      p.primary_image,
      COUNT(c.id) as click_count
    FROM products p
    JOIN affiliate_clicks c ON p.id = c.product_id
    GROUP BY p.id
    ORDER BY click_count DESC
    LIMIT 10
  `).all();

  const clicksByRetailer = db.prepare(`
    SELECT retailer_name, COUNT(*) as count
    FROM affiliate_clicks
    GROUP BY retailer_name
    ORDER BY count DESC
  `).all();

  const recentClicks = db.prepare(`
    SELECT 
      c.id, 
      c.product_id, 
      c.retailer_name, 
      c.destination_url, 
      c.clicked_at,
      p.title as product_title
    FROM affiliate_clicks c
    LEFT JOIN products p ON c.product_id = p.id
    ORDER BY c.clicked_at DESC
    LIMIT 25
  `).all();

  res.status(200).json({
    status: 'success',
    data: {
      summary: {
        totalProducts,
        totalClicks,
        activeRetailers,
        whitelistedDomains,
      },
      topProducts,
      clicksByRetailer,
      recentClicks,
    },
  });
}

export function handleGetRetailers(_req: Request, res: Response): void {
  const db = getDb();
  const retailers = db.prepare('SELECT * FROM retailers ORDER BY name ASC').all();
  res.status(200).json({
    status: 'success',
    data: retailers,
  });
}
