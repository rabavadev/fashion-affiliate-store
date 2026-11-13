import rawProducts from '../data/products.json';
import { Product } from '../types/product';
import {
  ProductCatalogResponse,
  SubcategoryFilterOption,
  CategoryInfo,
} from '../types/api';

const products: Product[] = rawProducts as Product[];

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
export function getSubcategoryFacets(items: Product[] = products): SubcategoryFilterOption[] {
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

/**
 * Calculates global price range across all products.
 */
export function getPriceRange(items: Product[] = products) {
  if (items.length === 0) {
    return { min: 0, max: 0 };
  }
  const prices = items.map((p) => p.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

/**
 * Queries and filters the fashion catalog.
 */
export function getProducts(query: GetProductsQuery): ProductCatalogResponse {
  let filtered = [...products];

  // 1. Category Filter
  if (query.category && query.category.toLowerCase() !== 'all') {
    const cat = query.category.toLowerCase();
    filtered = filtered.filter((p) => p.category.toLowerCase() === cat);
  }

  // 2. Subcategory Filter
  if (query.subcategory && query.subcategory.toLowerCase() !== 'all') {
    const sub = query.subcategory.toLowerCase();
    filtered = filtered.filter((p) => p.subcategory.toLowerCase() === sub);
  }

  // 3. Tag Filter
  if (query.tag) {
    const tagQuery = query.tag.toUpperCase();
    filtered = filtered.filter((p) =>
      p.tags.some((t) => t.toUpperCase() === tagQuery)
    );
  }

  // 4. Search Filter (sanitized text search across title, description, tags, composition)
  if (query.search && query.search.trim()) {
    const searchTerm = query.search.trim().toLowerCase();
    filtered = filtered.filter((p) => {
      return (
        p.title.toLowerCase().includes(searchTerm) ||
        p.subtitle.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.composition.toLowerCase().includes(searchTerm) ||
        p.tags.some((t) => t.toLowerCase().includes(searchTerm))
      );
    });
  }

  // 5. Price Bounds Filter
  if (typeof query.minPrice === 'number' && !isNaN(query.minPrice)) {
    filtered = filtered.filter((p) => p.price >= query.minPrice!);
  }
  if (typeof query.maxPrice === 'number' && !isNaN(query.maxPrice)) {
    filtered = filtered.filter((p) => p.price <= query.maxPrice!);
  }

  // 6. Sorting
  const sort = query.sort || 'featured';
  switch (sort) {
    case 'price-asc':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      filtered.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case 'featured':
    default:
      // Default to catalog order / rating balance
      break;
  }

  // 7. Pagination
  const total = filtered.length;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(query.limit) || 12));
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = (page - 1) * limit;
  const paginatedData = filtered.slice(startIndex, startIndex + limit);

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
      subcategories: getSubcategoryFacets(products),
      priceRange: getPriceRange(products),
    },
  };
}

/**
 * Retrieves a single product by its unique ID or URL slug.
 */
export function getProductById(idOrSlug: string): Product | undefined {
  if (!idOrSlug) return undefined;
  return products.find(
    (p) => p.id === idOrSlug || p.slug.toLowerCase() === idOrSlug.toLowerCase()
  );
}

/**
 * Returns the category navigation structure for the editorial top navigation.
 */
export function getCategories(): CategoryInfo[] {
  return [
    {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Luxury minimalist women garments inspired by MANGO editorial collections',
      itemCount: products.length,
      subcategories: getSubcategoryFacets(products),
    },
  ];
}
