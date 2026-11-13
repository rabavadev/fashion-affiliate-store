import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '../src/App';
import { Product } from '../src/types/product.types';

const mockCatalog: Product[] = [
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
      directTarget: 'https://shop.mango.com/us/item1',
      partner: 'Rakuten',
    },
  },
  {
    id: 'prod_mango_002',
    slug: 'velvet-cocktail-dress',
    title: 'Velvet cocktail dress',
    category: 'clothing',
    subcategory: 'party',
    tags: ['PARTY'],
    price: 179.99,
    currency: 'USD',
    images: {
      primary: 'https://images.unsplash.com/party-1.jpg',
      secondary: 'https://images.unsplash.com/party-1-hover.jpg',
    },
    affiliate: {
      redirectPath: '/api/v1/redirect/prod_mango_002',
      directTarget: 'https://shop.mango.com/us/item2',
      partner: 'Rakuten',
    },
  },
  {
    id: 'prod_mango_003',
    slug: 'tailored-blazer-dress',
    title: 'Tailored blazer dress',
    category: 'clothing',
    subcategory: 'office',
    tags: ['OFFICE'],
    price: 189.99,
    currency: 'USD',
    images: {
      primary: 'https://images.unsplash.com/office-1.jpg',
      secondary: 'https://images.unsplash.com/office-1-hover.jpg',
    },
    affiliate: {
      redirectPath: '/api/v1/redirect/prod_mango_003',
      directTarget: 'https://shop.mango.com/us/item3',
      partner: 'Rakuten',
    },
  },
];

describe('Tier 3: Cross-Feature Integrated Client State Journey', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it('orchestrates complete customer flow: filter -> grid switch -> wishlist toggle -> drawer -> affiliate link', () => {
    // 1. Render Storefront with initial catalog
    render(<App initialProducts={mockCatalog} />);

    // Step 1: Default Catalog Displayed (3 products)
    expect(screen.getByText('Pleated satin midi dress')).toBeInTheDocument();
    expect(screen.getByText('Velvet cocktail dress')).toBeInTheDocument();
    expect(screen.getByText('Tailored blazer dress')).toBeInTheDocument();

    // Step 2: Filter by Subcategory (PARTY)
    const partyFilter = screen.getByTestId('filter-party');
    fireEvent.click(partyFilter);

    // Verify only the party dress is visible
    expect(screen.getByText('Velvet cocktail dress')).toBeInTheDocument();
    expect(screen.queryByText('Pleated satin midi dress')).toBeNull();
    expect(screen.queryByText('Tailored blazer dress')).toBeNull();

    // Step 3: Switch Grid View from 4 columns to 2 columns (VIEW 2)
    const view2Btn = screen.getByTestId('view-2-btn');
    fireEvent.click(view2Btn);

    const productGrid = screen.getByTestId('product-grid');
    expect(productGrid).toHaveClass('sm:grid-cols-2');

    // Step 4: Toggle Wishlist Heart on Velvet cocktail dress
    // ProductCard heart button
    const cardHeart = screen.getByRole('button', { name: /add velvet cocktail dress to wishlist/i });
    fireEvent.click(cardHeart);

    // Verify Header Wishlist counter updates to 1
    const wishlistBadge = screen.getByTestId('wishlist-count');
    expect(wishlistBadge).toHaveTextContent('1');

    // Step 5: Switch Subcategory to OFFICE
    const officeFilter = screen.getByTestId('filter-office');
    fireEvent.click(officeFilter);

    // Verify product grid displays Tailored blazer dress
    expect(screen.getByText('Tailored blazer dress')).toBeInTheDocument();
    expect(screen.queryByText('Velvet cocktail dress')).toBeNull();

    // Verify Header Wishlist counter remains 1
    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('1');

    // Step 6: Open Wishlist Slide-Over Drawer
    const headerWishlistBtn = screen.getByRole('button', { name: /^wishlist$/i });
    fireEvent.click(headerWishlistBtn);

    // Verify Wishlist drawer is visible and contains the saved Velvet cocktail dress
    const drawer = screen.getByTestId('wishlist-drawer');
    expect(drawer).toBeInTheDocument();
    expect(screen.getByText('1 item saved')).toBeInTheDocument();
    expect(screen.getByText('Velvet cocktail dress')).toBeInTheDocument();

    // Step 7: Verify Outbound Affiliate Link inside Drawer
    const drawerAffiliateLink = screen.getByTestId('drawer-affiliate-link');
    expect(drawerAffiliateLink).toHaveAttribute('href', '/api/v1/redirect/prod_mango_002');
    expect(drawerAffiliateLink).toHaveAttribute('target', '_blank');

    // Step 8: Remove item from wishlist inside drawer
    const removeBtn = screen.getByTestId('remove-prod_mango_002');
    fireEvent.click(removeBtn);

    // Verify empty state is displayed inside drawer
    expect(screen.getByTestId('wishlist-empty-state')).toBeInTheDocument();
    expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument();
  });
});
