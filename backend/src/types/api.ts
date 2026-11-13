import { Product } from './product';

export interface SubcategoryFilterOption {
  key: string;
  label: string;
  count: number;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface ProductCatalogResponse {
  status: 'success';
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    subcategories: SubcategoryFilterOption[];
    priceRange: PriceRange;
  };
}

export interface SingleProductResponse {
  status: 'success';
  data: Product;
}

export interface CategoryInfo {
  name: string;
  slug: string;
  description: string;
  itemCount: number;
  subcategories: SubcategoryFilterOption[];
}

export interface CategoriesResponse {
  status: 'success';
  data: CategoryInfo[];
}

export interface ErrorResponse {
  status: 'error';
  message: string;
  code?: string;
  details?: unknown;
}
