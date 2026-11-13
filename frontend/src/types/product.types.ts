export interface ProductImageSet {
  primary: string;
  secondary: string;
  gallery?: string[];
}

export interface ProductColor {
  name: string;
  hex: string;
  inStock?: boolean;
}

export interface ProductRetailer {
  name: string;
  retailerId: string;
}

export interface ProductAffiliate {
  redirectPath: string;
  directTarget: string;
  partner: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  category: string;
  subcategory: string;
  tags: string[];
  price: number;
  currency: 'USD';
  originalPrice?: number;
  images: ProductImageSet;
  colors?: ProductColor[];
  sizes?: string[];
  inStock?: boolean;
  rating?: number;
  reviewCount?: number;
  retailer?: ProductRetailer;
  affiliate: ProductAffiliate;
  description?: string;
  composition?: string;
  createdAt?: string;
}

export interface SubcategoryOption {
  key: string;
  label: string;
  count?: number;
}

export type GridViewMode = 1 | 2 | 3 | 4;
