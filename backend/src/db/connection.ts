import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import rawProducts from '../data/products.json';
import { ALLOWED_DOMAINS } from '../config/whitelist';

let dbInstance: Database.Database | null = null;

export function getDatabasePath(): string {
  if (process.env.DATABASE_FILE) {
    return process.env.DATABASE_FILE;
  }
  const defaultDir = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(defaultDir)) {
    fs.mkdirSync(defaultDir, { recursive: true });
  }
  return path.join(defaultDir, 'store.db');
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    const dbPath = getDatabasePath();
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    initDatabase(dbInstance);
  }
  return dbInstance;
}

export function setTestDb(database: Database.Database): void {
  dbInstance = database;
  initDatabase(dbInstance);
}

export function closeDatabase(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // Ignore if already closed
    }
    dbInstance = null;
  }
}

export function initDatabase(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'clothing',
      subcategory TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      price REAL NOT NULL,
      original_price REAL,
      currency TEXT NOT NULL DEFAULT 'USD',
      primary_image TEXT NOT NULL,
      secondary_image TEXT NOT NULL,
      gallery_images TEXT NOT NULL DEFAULT '[]',
      colors TEXT NOT NULL DEFAULT '[]',
      sizes TEXT NOT NULL DEFAULT '[]',
      in_stock INTEGER NOT NULL DEFAULT 1,
      rating REAL NOT NULL DEFAULT 4.5,
      review_count INTEGER NOT NULL DEFAULT 0,
      retailer_name TEXT NOT NULL DEFAULT 'MANGO',
      retailer_id TEXT NOT NULL DEFAULT 'mango-us',
      affiliate_url TEXT NOT NULL,
      affiliate_partner TEXT NOT NULL DEFAULT 'Rakuten',
      description TEXT NOT NULL DEFAULT '',
      composition TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

    CREATE TABLE IF NOT EXISTS retailers (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      affiliate_network TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS affiliate_clicks (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      retailer_name TEXT NOT NULL,
      destination_url TEXT NOT NULL,
      ip_hash TEXT NOT NULL,
      user_agent TEXT NOT NULL,
      referrer TEXT NOT NULL,
      clicked_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_product_id ON affiliate_clicks(product_id);
    CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at ON affiliate_clicks(clicked_at);

    CREATE TABLE IF NOT EXISTS whitelist_domains (
      id TEXT PRIMARY KEY,
      domain TEXT UNIQUE NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  seedDatabaseIfEmpty(db);
}

export function seedDatabaseIfEmpty(db: Database.Database): void {
  // 1. Seed Admins
  const adminCount = (db.prepare('SELECT COUNT(*) as count FROM admins').get() as { count: number }).count;
  if (adminCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || 'AdminPassword123!';
    const passwordHash = bcrypt.hashSync(initialPassword, salt);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT OR IGNORE INTO admins (id, username, password_hash, created_at)
      VALUES (?, ?, ?, ?)
    `).run('admin_root_1', 'admin', passwordHash, now);
  }

  // 2. Seed Retailers
  const retailerCount = (db.prepare('SELECT COUNT(*) as count FROM retailers').get() as { count: number }).count;
  if (retailerCount === 0) {
    const now = new Date().toISOString();
    const defaultRetailers = [
      { id: 'ret_mango', name: 'MANGO', affiliate_network: 'Rakuten' },
      { id: 'ret_nordstrom', name: 'Nordstrom', affiliate_network: 'Rakuten' },
      { id: 'ret_netaporter', name: 'NET-A-PORTER', affiliate_network: 'Awin' },
      { id: 'ret_asos', name: 'ASOS', affiliate_network: 'CJ' },
      { id: 'ret_farfetch', name: 'Farfetch', affiliate_network: 'CJ' },
      { id: 'ret_revolve', name: 'Revolve', affiliate_network: 'Impact' },
      { id: 'ret_zara', name: 'Zara', affiliate_network: 'Direct' },
    ];

    const insertRetailer = db.prepare(`
      INSERT OR IGNORE INTO retailers (id, name, affiliate_network, is_active, created_at)
      VALUES (?, ?, ?, 1, ?)
    `);

    for (const ret of defaultRetailers) {
      insertRetailer.run(ret.id, ret.name, ret.affiliate_network, now);
    }
  }

  // 3. Seed Whitelist Domains
  const domainCount = (db.prepare('SELECT COUNT(*) as count FROM whitelist_domains').get() as { count: number }).count;
  if (domainCount === 0) {
    const now = new Date().toISOString();
    const insertDomain = db.prepare(`
      INSERT OR IGNORE INTO whitelist_domains (id, domain, is_active, created_at)
      VALUES (?, ?, 1, ?)
    `);

    let index = 1;
    for (const domain of ALLOWED_DOMAINS) {
      insertDomain.run(`wl_${index++}`, domain.toLowerCase(), now);
    }
  }

  // 4. Seed Products
  const prodCount = (db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }).count;
  if (prodCount === 0 && Array.isArray(rawProducts)) {
    const now = new Date().toISOString();
    const insertProduct = db.prepare(`
      INSERT OR IGNORE INTO products (
        id, slug, title, subtitle, category, subcategory, tags,
        price, original_price, currency, primary_image, secondary_image,
        gallery_images, colors, sizes, in_stock, rating, review_count,
        retailer_name, retailer_id, affiliate_url, affiliate_partner,
        description, composition, created_at, updated_at
      ) VALUES (
        @id, @slug, @title, @subtitle, @category, @subcategory, @tags,
        @price, @original_price, @currency, @primary_image, @secondary_image,
        @gallery_images, @colors, @sizes, @in_stock, @rating, @review_count,
        @retailer_name, @retailer_id, @affiliate_url, @affiliate_partner,
        @description, @composition, @created_at, @updated_at
      )
    `);

    const transaction = db.transaction((items: typeof rawProducts) => {
      for (const p of items) {
        insertProduct.run({
          id: p.id,
          slug: p.slug,
          title: p.title,
          subtitle: p.subtitle || '',
          category: p.category || 'clothing',
          subcategory: p.subcategory || 'dresses',
          tags: JSON.stringify(p.tags || []),
          price: Number(p.price) || 0,
          original_price: p.originalPrice !== undefined ? Number(p.originalPrice) : null,
          currency: p.currency || 'USD',
          primary_image: p.images?.primary || '',
          secondary_image: p.images?.secondary || p.images?.primary || '',
          gallery_images: JSON.stringify(p.images?.gallery || []),
          colors: JSON.stringify(p.colors || []),
          sizes: JSON.stringify(p.sizes || []),
          in_stock: p.inStock ? 1 : 0,
          rating: typeof p.rating === 'number' ? p.rating : 4.5,
          review_count: typeof p.reviewCount === 'number' ? p.reviewCount : 0,
          retailer_name: p.retailer?.name || 'MANGO',
          retailer_id: p.retailer?.retailerId || 'mango-us',
          affiliate_url: p.affiliate?.directTarget || '',
          affiliate_partner: p.affiliate?.partner || 'Rakuten',
          description: p.description || '',
          composition: p.composition || '',
          created_at: p.createdAt || now,
          updated_at: now,
        });
      }
    });

    transaction(rawProducts);
  }
}
