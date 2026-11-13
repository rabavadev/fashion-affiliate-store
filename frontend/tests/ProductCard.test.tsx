import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductCard from '../src/components/ProductCard';
import { Product } from '../src/types/product.types';

const mockProduct: Product = {
  id: 'prod_mango_001',
  slug: 'pleated-satin-midi-dress',
  title: 'Pleated satin midi dress',
  subtitle: 'Editorial Collection',
  category: 'clothing',
  subcategory: 'dresses',
  tags: ['NEW NOW'],
  price: 129.99,
  currency: 'USD',
  originalPrice: 159.99,
  images: {
    primary: 'https://images.unsplash.com/dress-primary.jpg',
    secondary: 'https://images.unsplash.com/dress-hover.jpg',
  },
  retailer: {
    name: 'MANGO',
    retailerId: 'mango-us',
  },
  affiliate: {
    redirectPath: '/api/v1/redirect/prod_mango_001',
    directTarget: 'https://shop.mango.com/us/women/dresses/satin-dress_123.html',
    partner: 'Rakuten',
  },
};

describe('Tier 1: Feature Coverage - ProductCard Component', () => {
  it('renders product title, formatted price, and status tag (NEW NOW)', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Pleated satin midi dress')).toBeInTheDocument();
    expect(screen.getByText('$129.99')).toBeInTheDocument();
    expect(screen.getByText('NEW NOW')).toBeInTheDocument();
  });

  it('renders in 3:4 portrait aspect ratio container', () => {
    const { container } = render(<ProductCard product={mockProduct} />);
    const aspectContainer = container.querySelector('.aspect-\\[3\\/4\\]');
    expect(aspectContainer).not.toBeNull();
  });

  it('displays primary image by default with full opacity', () => {
    render(<ProductCard product={mockProduct} />);
    const primaryImg = screen.getByAltText('Pleated satin midi dress');
    expect(primaryImg).toHaveAttribute('src', 'https://images.unsplash.com/dress-primary.jpg');
    expect(primaryImg).toHaveClass('opacity-100');
  });

  it('renders layered dual images and executes opacity crossfade on hover', () => {
    render(<ProductCard product={mockProduct} />);
    const card = screen.getByTestId('product-card');
    const primaryImg = screen.getByAltText('Pleated satin midi dress');
    const secondaryImg = screen.getByAltText('Pleated satin midi dress - alternate view');

    // Default state: primary visible, secondary hidden
    expect(primaryImg).toHaveAttribute('src', 'https://images.unsplash.com/dress-primary.jpg');
    expect(primaryImg).toHaveClass('opacity-100');
    expect(secondaryImg).toHaveAttribute('src', 'https://images.unsplash.com/dress-hover.jpg');
    expect(secondaryImg).toHaveClass('opacity-0');

    // Hover state: primary crossfades out (opacity-0), secondary crossfades in (opacity-100)
    fireEvent.mouseEnter(card);
    expect(primaryImg).toHaveClass('opacity-0');
    expect(secondaryImg).toHaveClass('opacity-100');

    // Mouse leave: restores primary opacity-100 and secondary opacity-0
    fireEvent.mouseLeave(card);
    expect(primaryImg).toHaveClass('opacity-100');
    expect(secondaryImg).toHaveClass('opacity-0');
  });

  it('gracefully falls back to EDITORIAL_FALLBACK_IMAGE on image load error', () => {
    render(<ProductCard product={mockProduct} />);
    const primaryImg = screen.getByAltText('Pleated satin midi dress');

    fireEvent.error(primaryImg);
    expect(primaryImg.getAttribute('src')).toMatch(/^data:image\/svg\+xml/);
  });

  it('gracefully handles missing images without console errors or crash', () => {
    const noImagesProduct: Product = {
      ...mockProduct,
      images: undefined as any,
    };
    render(<ProductCard product={noImagesProduct} />);
    const img = screen.getByAltText('Pleated satin midi dress');
    expect(img.getAttribute('src')).toMatch(/^data:image\/svg\+xml/);
  });

  it('renders outbound affiliate redirect link pointing to /api/v1/redirect/:productId with rel="noopener noreferrer sponsored"', () => {
    render(<ProductCard product={mockProduct} />);
    const affiliateBtn = screen.getByTestId('affiliate-button');
    expect(affiliateBtn).toHaveAttribute('href', '/api/v1/redirect/prod_mango_001');
    expect(affiliateBtn).toHaveAttribute('target', '_blank');
    expect(affiliateBtn).toHaveAttribute('rel', 'noopener noreferrer sponsored');
  });

  it('invokes onToggleWishlist with product ID when heart button is clicked', () => {
    const handleToggle = vi.fn();
    render(<ProductCard product={mockProduct} onToggleWishlist={handleToggle} isWishlisted={false} />);

    const heartBtn = screen.getByTestId('wishlist-toggle');
    fireEvent.click(heartBtn);

    expect(handleToggle).toHaveBeenCalledTimes(1);
    expect(handleToggle).toHaveBeenCalledWith('prod_mango_001');
  });

  it('renders filled heart icon when product is wishlisted', () => {
    const { container } = render(<ProductCard product={mockProduct} isWishlisted={true} />);
    const filledSvg = container.querySelector('.fill-red-500');
    expect(filledSvg).not.toBeNull();
  });
});
