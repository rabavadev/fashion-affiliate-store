import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WishlistDrawer from '../src/components/WishlistDrawer';
import { Product } from '../src/types/product.types';

const mockItems: Product[] = [
  {
    id: 'prod_mango_001',
    slug: 'pleated-satin-midi-dress',
    title: 'Pleated satin midi dress',
    category: 'clothing',
    subcategory: 'dresses',
    tags: ['NEW NOW'],
    price: 129.99,
    currency: 'USD',
    images: {
      primary: 'https://images.unsplash.com/dress-1.jpg',
      secondary: 'https://images.unsplash.com/dress-1-hover.jpg',
    },
    affiliate: {
      redirectPath: '/api/v1/redirect/prod_mango_001',
      directTarget: 'https://shop.mango.com/item1',
      partner: 'Rakuten',
    },
  },
  {
    id: 'prod_mango_002',
    slug: 'asymmetric-draped-gown',
    title: 'Asymmetric draped gown',
    category: 'clothing',
    subcategory: 'dresses',
    tags: ['BESTSELLER'],
    price: 199.99,
    currency: 'USD',
    images: {
      primary: 'https://images.unsplash.com/dress-2.jpg',
      secondary: 'https://images.unsplash.com/dress-2-hover.jpg',
    },
    affiliate: {
      redirectPath: '/api/v1/redirect/prod_mango_002',
      directTarget: 'https://shop.mango.com/item2',
      partner: 'Rakuten',
    },
  },
];

describe('Tier 1: Feature Coverage - WishlistDrawer Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <WishlistDrawer isOpen={false} onClose={vi.fn()} items={mockItems} onRemove={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders drawer dialog and saved items when isOpen is true', () => {
    render(
      <WishlistDrawer isOpen={true} onClose={vi.fn()} items={mockItems} onRemove={vi.fn()} />
    );

    expect(screen.getByTestId('wishlist-drawer')).toBeInTheDocument();
    expect(screen.getByText('2 items saved')).toBeInTheDocument();
    expect(screen.getByText('Pleated satin midi dress')).toBeInTheDocument();
    expect(screen.getByText('Asymmetric draped gown')).toBeInTheDocument();
  });

  it('invokes onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <WishlistDrawer isOpen={true} onClose={handleClose} items={mockItems} onRemove={vi.fn()} />
    );

    fireEvent.click(screen.getByTestId('close-wishlist'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('invokes onClose when backdrop is clicked', () => {
    const handleClose = vi.fn();
    render(
      <WishlistDrawer isOpen={true} onClose={handleClose} items={mockItems} onRemove={vi.fn()} />
    );

    fireEvent.click(screen.getByTestId('wishlist-backdrop'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('invokes onRemove with matching product ID when remove button is clicked', () => {
    const handleRemove = vi.fn();
    render(
      <WishlistDrawer isOpen={true} onClose={vi.fn()} items={mockItems} onRemove={handleRemove} />
    );

    const removeBtn = screen.getByTestId('remove-prod_mango_001');
    fireEvent.click(removeBtn);
    expect(handleRemove).toHaveBeenCalledWith('prod_mango_001');
  });

  it('renders working outbound affiliate links for saved items inside drawer', () => {
    render(
      <WishlistDrawer isOpen={true} onClose={vi.fn()} items={mockItems} onRemove={vi.fn()} />
    );

    const affiliateLinks = screen.getAllByTestId('drawer-affiliate-link');
    expect(affiliateLinks.length).toBe(2);
    expect(affiliateLinks[0]).toHaveAttribute('href', '/api/v1/redirect/prod_mango_001');
    expect(affiliateLinks[0]).toHaveAttribute('target', '_blank');
  });

  it('displays empty state message when wishlist items array is empty', () => {
    render(
      <WishlistDrawer isOpen={true} onClose={vi.fn()} items={[]} onRemove={vi.fn()} />
    );

    expect(screen.getByTestId('wishlist-empty-state')).toBeInTheDocument();
    expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument();
  });
});
