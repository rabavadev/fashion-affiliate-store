import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Product } from '../types/product.types';
import { EDITORIAL_FALLBACK_IMAGE } from '../services/api';

export interface ProductCardProps {
  product: Product;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const primaryImage = product.images?.primary || '';
  const secondaryImage = product.images?.secondary || '';
  const hasSecondary = Boolean(secondaryImage && secondaryImage !== primaryImage && !imgError);
  const displayPrimary = imgError || !primaryImage ? EDITORIAL_FALLBACK_IMAGE : primaryImage;

  const statusTag = product.tags?.[0];
  const redirectUrl = product.affiliate?.redirectPath || `/api/v1/redirect/${product.id}`;

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: product.currency || 'USD',
  }).format(product.price);

  return (
    <article
      className="group relative flex flex-col bg-white"
      data-testid="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3:4 Aspect Ratio Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F3F1EC]">
        {/* Layered images for luxury editorial dual-image opacity crossfade */}
        {isHovered && hasSecondary ? (
          <>
            {/* Secondary Hover Image (Active top on hover) */}
            <img
              key="secondary"
              src={secondaryImage}
              alt={`${product.title} - alternate view`}
              data-testid="product-secondary-image"
              loading="lazy"
              onError={() => setImgError(true)}
              className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 group-hover:scale-105 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            />
            {/* Primary Image */}
            <img
              key="primary"
              src={displayPrimary}
              alt={product.title}
              data-testid="product-primary-image"
              loading="lazy"
              onError={() => setImgError(true)}
              className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 group-hover:scale-105 ${
                isHovered && hasSecondary ? 'opacity-0' : 'opacity-100'
              }`}
            />
          </>
        ) : (
          <>
            {/* Primary Image */}
            <img
              key="primary"
              src={displayPrimary}
              alt={product.title}
              data-testid="product-primary-image"
              loading="lazy"
              onError={() => setImgError(true)}
              className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 group-hover:scale-105 ${
                isHovered && hasSecondary ? 'opacity-0' : 'opacity-100'
              }`}
            />
            {/* Secondary Hover Image (Crossfade layer) */}
            {hasSecondary && (
              <img
                key="secondary"
                src={secondaryImage}
                alt={`${product.title} - alternate view`}
                data-testid="product-secondary-image"
                loading="lazy"
                onError={() => setImgError(true)}
                className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 group-hover:scale-105 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}
          </>
        )}

        {/* Status Tag Overlay (e.g. NEW NOW) */}
        {statusTag && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-[#111111] shadow-sm select-none">
            {statusTag}
          </span>
        )}

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist?.(product.id);
          }}
          aria-label={isWishlisted ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
          data-testid="wishlist-toggle"
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white text-neutral-800 transition-colors shadow-sm"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted
                ? 'fill-red-500 text-red-500 fill-[#C93B2B] text-[#C93B2B]'
                : 'text-neutral-700 hover:text-neutral-950 stroke-[1.5]'
            }`}
          />
        </button>

        {/* Quick Outbound Affiliate Overlay Button (Reveals on Hover) */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center">
          <a
            href={redirectUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            data-testid="affiliate-button"
            className="w-full text-center bg-white text-[#111111] py-2.5 text-xs font-medium uppercase tracking-wider hover:bg-[#111111] hover:text-white transition-colors duration-200 shadow"
          >
            BUY ON {product.retailer?.name || 'MANGO'}
          </a>
        </div>
      </div>

      {/* Product Details */}
      <div className="mt-3 flex flex-col space-y-1">
        <h3 className="text-xs uppercase tracking-wider text-[#111111] font-light truncate">
          <a href={redirectUrl} target="_blank" rel="noopener noreferrer sponsored">
            {product.title}
          </a>
        </h3>

        <div className="flex items-baseline space-x-2">
          <span className="text-xs font-medium text-[#111111]">{formattedPrice}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-[11px] text-[#767676] line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
