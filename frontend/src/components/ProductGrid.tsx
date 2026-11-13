import React from 'react';
import { Product, GridViewMode } from '../types/product.types';
import ProductCard from './ProductCard';

export interface ProductGridProps {
  products: Product[];
  columns: GridViewMode;
  wishlistIds?: string[];
  onToggleWishlist?: (productId: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  columns,
  wishlistIds = [],
  onToggleWishlist,
}) => {
  const columnClasses: Record<GridViewMode, string> = {
    1: 'grid-cols-1 max-w-xl mx-auto',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  if (products.length === 0) {
    return (
      <div
        className="py-24 text-center"
        data-testid="product-grid-empty"
      >
        <p className="text-sm uppercase tracking-widest text-neutral-400">
          No garments found matching your criteria
        </p>
        <p className="text-xs text-neutral-500 mt-2">
          Try selecting another subcategory or clearing your filters.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-x-6 gap-y-10 ${columnClasses[columns] || columnClasses[4]}`}
      data-testid="product-grid"
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isWishlisted={wishlistIds.includes(product.id)}
          onToggleWishlist={onToggleWishlist}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
