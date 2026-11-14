import { getDb } from '../db/connection';
import { Product } from '../types/product';
import {
  ProductCatalogResponse,
  SubcategoryFilterOption,
  CategoryInfo,
} from '../types/api';

export interface ProductRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  subcategory: string;
  tags: string;
  price: number;
  original_price: number | null;
  currency: string;
  primary_image: string;
  secondary_image: string;
  gallery_images: string;
  colors: string;
  sizes: string;
  in_stock: number;
  rating: number;
  review_count: number;
  retailer_name: string;
  retailer_id: string;
  affiliate_url: string;
  affiliate_partner: string;
  description: string;
  composition: string;
  created_at: string;
  updated_at: string;
}

export function mapRowToProduct(row: ProductRow): Product {
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags || '[]');
  } catch {
    tags = [];
  }

  let gallery: string[] = [];
  try {
    gallery = JSON.parse(row.gallery_images || '[]');
  } catch {
    gallery = [];
  }

  let colors: Array<{ name: string; hex: string; inStock: boolean }> = [];
  try {
    colors = JSON.parse(row.colors || '[]');
  } catch {
    colors = [];
  }

  let sizes: string[] = [];
  try {
    sizes = JSON.parse(row.sizes || '[]');
  } catch {
    sizes = [];
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle || '',
    category: row.category,
    subcategory: row.subcategory,
    tags,
    price: row.price,
    currency: 'USD',
    originalPrice: row.original_price !== null ? row.original_price : undefined,
    images: {
      primary: row.primary_image,
      secondary: row.secondary_image || row.primary_image,
      gallery,
    },
    colors,
    sizes,
    inStock: Boolean(row.in_stock),
    rating: row.rating,
    reviewCount: row.review_count,
    retailer: {
      name: row.retailer_name,
      retailerId: row.retailer_id,
    },
    affiliate: {
      redirectPath: `/api/v1/redirect/${row.id}`,
      directTarget: row.affiliate_url,
      partner: row.affiliate_partner,
    },
    description: row.description,
    composition: row.composition,
    createdAt: row.created_at,
  };
}

export interface GetProductsQuery {
  category?: string;
  subcategory?: string;
  search?: string;
  tag?: string;
  sort?: 'featured' | 'newest' | 'price-asc' | 'price-desc';
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
}

const SUBCATEGORY_DEFINITIONS: { key: string; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'dresses', label: 'DRESSES' },
  { key: 'jumpsuits', label: 'JUMPSUITS' },
  { key: 'party', label: 'PARTY' },
  { key: 'wedding-guest', label: 'WEDDING GUEST' },
  { key: 'office', label: 'OFFICE' },
  { key: 'long', label: 'LONG' },
  { key: 'midi', label: 'MIDI' },
  { key: 'short', label: 'SHORT' },
  { key: 'knitwear', label: 'KNITWEAR' },
];

/**
 * Returns subcategory facet counts based on the current product dataset.
 */
export function getSubcategoryFacets(items?: Product[]): SubcategoryFilterOption[] {
  if (items) {
    return SUBCATEGORY_DEFINITIONS.map((def) => {
      if (def.key === 'all') {
        return {
          key: def.key,
          label: def.label,
          count: items.length,
        };
      }
      const count = items.filter(
        (p) => p.subcategory.toLowerCase() === def.key.toLowerCase()
      ).length;
      return {
        key: def.key,
        label: def.label,
        count,
      };
    });
  }

  const db = getDb();
  const totalRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  const totalCount = totalRow ? totalRow.count : 0;

  const countRows = db.prepare(`
    SELECT LOWER(subcategory) as sub, COUNT(*) as count
    FROM products
    GROUP BY LOWER(subcategory)
  `).all() as { sub: string; count: number }[];

  const countMap = new Map<string, number>();
  for (const row of countRows) {
    countMap.set(row.sub, row.count);
  }

  return SUBCATEGORY_DEFINITIONS.map((def) => {
    if (def.key === 'all') {
      return {
        key: def.key,
        label: def.label,
        count: totalCount,
      };
    }
    return {
      key: def.key,
      label: def.label,
      count: countMap.get(def.key.toLowerCase()) || 0,
    };
  });
}

/**
 * Calculates global price range across all products in SQLite.
 */
export function getPriceRange(items?: Product[]): { min: number; max: number } {
  if (items && items.length > 0) {
    const prices = items.map((p) => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  const db = getDb();
  const row = db.prepare('SELECT MIN(price) as minPrice, MAX(price) as maxPrice FROM products').get() as {
    minPrice: number | null;
    maxPrice: number | null;
  };

  if (!row || row.minPrice === null || row.maxPrice === null) {
    return { min: 0, max: 0 };
  }

  return {
    min: row.minPrice,
    max: row.maxPrice,
  };
}

/**
 * Queries and filters the fashion catalog directly via SQLite.
 */
export function getProducts(query: GetProductsQuery): ProductCatalogResponse {
  const db = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  // 1. Category Filter
  if (query.category && query.category.toLowerCase() !== 'all') {
    conditions.push('LOWER(category) = ?');
    params.push(query.category.toLowerCase());
  }

  // 2. Subcategory Filter
  if (query.subcategory && query.subcategory.toLowerCase() !== 'all') {
    conditions.push('LOWER(subcategory) = ?');
    params.push(query.subcategory.toLowerCase());
  }

  // 3. Tag Filter
  if (query.tag) {
    conditions.push('LOWER(tags) LIKE ?');
    params.push(`%${query.tag.toLowerCase()}%`);
  }

  // 4. Search Filter
  if (query.search && query.search.trim()) {
    const term = `%${query.search.trim().toLowerCase()}%`;
    conditions.push(`(
      LOWER(title) LIKE ? OR
      LOWER(subtitle) LIKE ? OR
      LOWER(description) LIKE ? OR
      LOWER(composition) LIKE ? OR
      LOWER(tags) LIKE ?
    )`);
    params.push(term, term, term, term, term);
  }

  // 5. Price Bounds Filter
  if (typeof query.minPrice === 'number' && !isNaN(query.minPrice)) {
    conditions.push('price >= ?');
    params.push(query.minPrice);
  }
  if (typeof query.maxPrice === 'number' && !isNaN(query.maxPrice)) {
    conditions.push('price <= ?');
    params.push(query.maxPrice);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 6. Sorting
  let orderBy = 'rowid ASC';
  const sort = query.sort || 'featured';
  switch (sort) {
    case 'price-asc':
      orderBy = 'price ASC';
      break;
    case 'price-desc':
      orderBy = 'price DESC';
      break;
    case 'newest':
      orderBy = 'created_at DESC';
      break;
    case 'featured':
    default:
      orderBy = 'rowid ASC';
      break;
  }

  // Count total matching
  const countRow = db.prepare(`SELECT COUNT(*) as count FROM products ${whereClause}`).get(...params) as {
    count: number;
  };
  const total = countRow ? countRow.count : 0;

  // 7. Pagination
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(query.limit) || 12));
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const offset = (page - 1) * limit;

  const rows = db.prepare(`
    SELECT * FROM products
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as ProductRow[];

  const paginatedData = rows.map(mapRowToProduct);

  return {
    status: 'success',
    data: paginatedData,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    filters: {
      subcategories: getSubcategoryFacets(),
      priceRange: getPriceRange(),
    },
  };
}

/**
 * Retrieves a single product by its unique ID or URL slug from SQLite.
 */
export function getProductById(idOrSlug: string): Product | undefined {
  if (!idOrSlug) return undefined;
  const db = getDb();
  const row = db.prepare(`
    SELECT * FROM products
    WHERE id = ? OR LOWER(slug) = LOWER(?)
    LIMIT 1
  `).get(idOrSlug, idOrSlug) as ProductRow | undefined;

  return row ? mapRowToProduct(row) : undefined;
}

/**
 * Returns the category navigation structure for editorial navigation.
 */
export function getCategories(): CategoryInfo[] {
  const db = getDb();
  const countRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  const itemCount = countRow ? countRow.count : 0;

  return [
    {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Luxury minimalist women garments inspired by MANGO editorial collections',
      itemCount,
      subcategories: getSubcategoryFacets(),
    },
  ];
}

// ----------------------------------------------------
// Admin CRM Product Management Functions
// ----------------------------------------------------

export interface AdminCreateProductInput {
  title: string;
  subtitle?: string;
  category?: string;
  subcategory: string;
  tags?: string[];
  price: number;
  originalPrice?: number;
  currency?: 'USD';
  primaryImage: string;
  secondaryImage?: string;
  galleryImages?: string[];
  colors?: Array<{ name: string; hex: string; inStock?: boolean }>;
  sizes?: string[];
  inStock?: boolean;
  rating?: number;
  reviewCount?: number;
  retailerName?: string;
  retailerId?: string;
  affiliateUrl: string;
  affiliatePartner?: string;
  description?: string;
  composition?: string;
}

export type AdminUpdateProductInput = Partial<AdminCreateProductInput>;

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base}-${Math.random().toString(36).substring(2, 6)}`;
}

export function createProduct(input: AdminCreateProductInput): Product {
  const db = getDb();
  const now = new Date().toISOString();
  const id = `prod_crm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const slug = generateSlug(input.title);

  const stmt = db.prepare(`
    INSERT INTO products (
      id, slug, title, subtitle, category, subcategory, tags,
      price, original_price, currency, primary_image, secondary_image,
      gallery_images, colors, sizes, in_stock, rating, review_count,
      retailer_name, retailer_id, affiliate_url, affiliate_partner,
      description, composition, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `);

  stmt.run(
    id,
    slug,
    input.title,
    input.subtitle || '',
    input.category || 'clothing',
    input.subcategory,
    JSON.stringify(input.tags || []),
    input.price,
    input.originalPrice !== undefined ? input.originalPrice : null,
    input.currency || 'USD',
    input.primaryImage,
    input.secondaryImage || input.primaryImage,
    JSON.stringify(input.galleryImages || []),
    JSON.stringify(input.colors || []),
    JSON.stringify(input.sizes || []),
    input.inStock !== false ? 1 : 0,
    input.rating !== undefined ? input.rating : 4.5,
    input.reviewCount !== undefined ? input.reviewCount : 0,
    input.retailerName || 'MANGO',
    input.retailerId || 'mango-us',
    input.affiliateUrl,
    input.affiliatePartner || 'Rakuten',
    input.description || '',
    input.composition || '',
    now,
    now
  );

  return getProductById(id)!;
}

export function updateProduct(id: string, input: AdminUpdateProductInput): Product | undefined {
  const existing = getProductById(id);
  if (!existing) return undefined;

  const db = getDb();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const params: unknown[] = [];

  if (input.title !== undefined) {
    updates.push('title = ?');
    params.push(input.title);
  }
  if (input.subtitle !== undefined) {
    updates.push('subtitle = ?');
    params.push(input.subtitle);
  }
  if (input.category !== undefined) {
    updates.push('category = ?');
    params.push(input.category);
  }
  if (input.subcategory !== undefined) {
    updates.push('subcategory = ?');
    params.push(input.subcategory);
  }
  if (input.tags !== undefined) {
    updates.push('tags = ?');
    params.push(JSON.stringify(input.tags));
  }
  if (input.price !== undefined) {
    updates.push('price = ?');
    params.push(input.price);
  }
  if (input.originalPrice !== undefined) {
    updates.push('original_price = ?');
    params.push(input.originalPrice);
  }
  if (input.primaryImage !== undefined) {
    updates.push('primary_image = ?');
    params.push(input.primaryImage);
  }
  if (input.secondaryImage !== undefined) {
    updates.push('secondary_image = ?');
    params.push(input.secondaryImage);
  }
  if (input.galleryImages !== undefined) {
    updates.push('gallery_images = ?');
    params.push(JSON.stringify(input.galleryImages));
  }
  if (input.colors !== undefined) {
    updates.push('colors = ?');
    params.push(JSON.stringify(input.colors));
  }
  if (input.sizes !== undefined) {
    updates.push('sizes = ?');
    params.push(JSON.stringify(input.sizes));
  }
  if (input.inStock !== undefined) {
    updates.push('in_stock = ?');
    params.push(input.inStock ? 1 : 0);
  }
  if (input.rating !== undefined) {
    updates.push('rating = ?');
    params.push(input.rating);
  }
  if (input.reviewCount !== undefined) {
    updates.push('review_count = ?');
    params.push(input.reviewCount);
  }
  if (input.retailerName !== undefined) {
    updates.push('retailer_name = ?');
    params.push(input.retailerName);
  }
  if (input.retailerId !== undefined) {
    updates.push('retailer_id = ?');
    params.push(input.retailerId);
  }
  if (input.affiliateUrl !== undefined) {
    updates.push('affiliate_url = ?');
    params.push(input.affiliateUrl);
  }
  if (input.affiliatePartner !== undefined) {
    updates.push('affiliate_partner = ?');
    params.push(input.affiliatePartner);
  }
  if (input.description !== undefined) {
    updates.push('description = ?');
    params.push(input.description);
  }
  if (input.composition !== undefined) {
    updates.push('composition = ?');
    params.push(input.composition);
  }

  updates.push('updated_at = ?');
  params.push(now);

  params.push(id);

  db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  return getProductById(id);
}

export function deleteProduct(id: string): boolean {
  const db = getDb();
  const res = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return res.changes > 0;
}

export interface AdminProductListQuery {
  search?: string;
  subcategory?: string;
  inStock?: boolean;
  page?: number;
  limit?: number;
}

export function getAdminProducts(query: AdminProductListQuery) {
  const db = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.search && query.search.trim()) {
    const term = `%${query.search.trim().toLowerCase()}%`;
    conditions.push('(LOWER(title) LIKE ? OR LOWER(retailer_name) LIKE ? OR LOWER(id) LIKE ?)');
    params.push(term, term, term);
  }

  if (query.subcategory && query.subcategory.toLowerCase() !== 'all') {
    conditions.push('LOWER(subcategory) = ?');
    params.push(query.subcategory.toLowerCase());
  }

  if (typeof query.inStock === 'boolean') {
    conditions.push('in_stock = ?');
    params.push(query.inStock ? 1 : 0);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRow = db.prepare(`SELECT COUNT(*) as count FROM products ${whereClause}`).get(...params) as {
    count: number;
  };
  const total = countRow ? countRow.count : 0;

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const offset = (page - 1) * limit;

  const rows = db.prepare(`
    SELECT * FROM products
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as ProductRow[];

  return {
    status: 'success',
    data: rows.map(mapRowToProduct),
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}
