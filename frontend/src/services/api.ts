import { Product, SubcategoryOption } from '../types/product.types';
import localCatalog from '../data/products.json';

// Minimalist elegant editorial SVG placeholder for offline / CDN failure resilience
export const EDITORIAL_FALLBACK_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" width="900" height="1200" fill="#F3F1EC">
  <rect width="900" height="1200" fill="#F3F1EC"/>
  <text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="32" letter-spacing="0.25em" fill="#767676">MANGO</text>
  <text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" letter-spacing="0.2em" fill="#A0A0A0">EDITORIAL ARCHIVE</text>
</svg>
`)}`;

export interface FetchProductsParams {
  subcategory?: string;
  search?: string;
  sort?: 'featured' | 'newest' | 'price-asc' | 'price-desc';
  page?: number;
  limit?: number;
}

export interface FetchProductsResponse {
  data: Product[];
  total: number;
}

/**
 * Filter and sort local fallback catalog in-memory
 */
export function filterLocalProducts(params?: FetchProductsParams): Product[] {
  let list = (localCatalog as unknown as Product[]).slice();

  if (params?.subcategory && params.subcategory.toLowerCase() !== 'all') {
    const target = params.subcategory.toLowerCase();
    list = list.filter((p) => p.subcategory?.toLowerCase() === target);
  }

  if (params?.search) {
    const q = params.search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (params?.sort) {
    if (params.sort === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (params.sort === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (params.sort === 'newest') {
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }
  }

  if (params?.limit && params.limit > 0) {
    const page = params.page || 1;
    const start = (page - 1) * params.limit;
    return list.slice(start, start + params.limit);
  }

  return list;
}

/**
 * Fetch products from API with seamless fallback to bundled JSON
 */
export async function fetchProducts(params?: FetchProductsParams): Promise<FetchProductsResponse> {
  const query = new URLSearchParams();
  if (params?.subcategory && params.subcategory !== 'all') query.set('subcategory', params.subcategory);
  if (params?.search) query.set('search', params.search);
  if (params?.sort) query.set('sort', params.sort);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const queryString = query.toString();
  const endpoint = queryString ? `/api/v1/products?${queryString}` : '/api/v1/products';

  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }
    const json = await res.json();
    return {
      data: json.data || [],
      total: json.meta?.total || json.data?.length || 0,
    };
  } catch {
    // Resilient offline / zero-network fallback
    const fallbackList = filterLocalProducts(params);
    return {
      data: fallbackList,
      total: fallbackList.length,
    };
  }
}

/**
 * Fetch a single product by ID
 */
export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`/api/v1/products/${id}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch {
    const found = (localCatalog as unknown as Product[]).find((p) => p.id === id);
    return found || null;
  }
}

/**
 * Compute subcategory pill counts dynamically from products
 */
export function computeSubcategoryFacetCounts(
  products: Product[],
  options: SubcategoryOption[]
): SubcategoryOption[] {
  const counts: Record<string, number> = { all: products.length };

  for (const p of products) {
    const sub = (p.subcategory || '').toLowerCase();
    counts[sub] = (counts[sub] || 0) + 1;
  }

  return options.map((opt) => ({
    ...opt,
    count: opt.key === 'all' ? products.length : counts[opt.key.toLowerCase()] || 0,
  }));
}
