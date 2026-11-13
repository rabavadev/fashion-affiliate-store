import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  WishlistProvider,
  useWishlist,
  WISHLIST_STORAGE_KEY,
  LEGACY_STORAGE_KEY,
} from '../src/context/WishlistContext';
import { Product } from '../src/types/product.types';

const testProduct: Product = {
  id: 'prod_test_001',
  slug: 'test-dress',
  title: 'Test Satin Dress',
  category: 'clothing',
  subcategory: 'dresses',
  tags: ['NEW NOW'],
  price: 99.99,
  currency: 'USD',
  images: {
    primary: 'https://example.com/test-primary.jpg',
    secondary: 'https://example.com/test-secondary.jpg',
  },
  retailer: {
    name: 'MANGO',
    retailerId: 'mango-us',
  },
  affiliate: {
    redirectPath: '/api/v1/redirect/prod_test_001',
    directTarget: 'https://shop.mango.com/test',
    partner: 'Rakuten',
  },
};

const TestConsumer: React.FC = () => {
  const { wishlist, toggleWishlist, removeFromWishlist, isInWishlist, clearWishlist, count } =
    useWishlist();

  return (
    <div>
      <div data-testid="wishlist-count">{count}</div>
      <div data-testid="is-in-wishlist">{isInWishlist(testProduct.id) ? 'YES' : 'NO'}</div>
      <button data-testid="toggle-btn" onClick={() => toggleWishlist(testProduct)}>
        Toggle
      </button>
      <button data-testid="remove-btn" onClick={() => removeFromWishlist(testProduct.id)}>
        Remove
      </button>
      <button data-testid="clear-btn" onClick={clearWishlist}>
        Clear
      </button>
      <ul data-testid="items-list">
        {wishlist.map((item) => (
          <li key={item.id} data-testid={`item-${item.id}`}>
            {item.title}
          </li>
        ))}
      </ul>
    </div>
  );
};

describe('Tier 2: Boundary & Resilience - WishlistContext Robustness', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('initializes cleanly with empty array when localStorage is empty', () => {
    render(
      <WishlistProvider>
        <TestConsumer />
      </WishlistProvider>
    );

    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('0');
    expect(screen.getByTestId('is-in-wishlist')).toHaveTextContent('NO');
  });

  it('recovers gracefully without crash when localStorage contains "null"', () => {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, 'null');

    expect(() => {
      render(
        <WishlistProvider>
          <TestConsumer />
        </WishlistProvider>
      );
    }).not.toThrow();

    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('0');
    expect(screen.getByTestId('is-in-wishlist')).toHaveTextContent('NO');
  });

  it('recovers gracefully without crash when legacy storage key contains "null"', () => {
    window.localStorage.setItem(LEGACY_STORAGE_KEY, 'null');

    expect(() => {
      render(
        <WishlistProvider>
          <TestConsumer />
        </WishlistProvider>
      );
    }).not.toThrow();

    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('0');
  });

  it('recovers gracefully when localStorage contains primitive number "12345"', () => {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, '12345');

    render(
      <WishlistProvider>
        <TestConsumer />
      </WishlistProvider>
    );

    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('0');
    // Verify toggle does not throw TypeError: wishlist.some is not a function
    expect(() => {
      act(() => {
        screen.getByTestId('toggle-btn').click();
      });
    }).not.toThrow();
    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('1');
  });

  it('recovers gracefully when localStorage contains plain object \'{"test": 123}\'', () => {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, '{"test": 123}');

    render(
      <WishlistProvider>
        <TestConsumer />
      </WishlistProvider>
    );

    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('0');
    expect(screen.getByTestId('is-in-wishlist')).toHaveTextContent('NO');
  });

  it('recovers gracefully when localStorage contains JSON string \'"corrupted_str"\'', () => {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, '"corrupted_str"');

    render(
      <WishlistProvider>
        <TestConsumer />
      </WishlistProvider>
    );

    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('0');
  });

  it('recovers gracefully when localStorage contains boolean \'true\' or \'false\'', () => {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, 'true');

    render(
      <WishlistProvider>
        <TestConsumer />
      </WishlistProvider>
    );

    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('0');
  });

  it('recovers gracefully when localStorage contains syntax-corrupted non-JSON', () => {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, '{invalid json');

    expect(() => {
      render(
        <WishlistProvider>
          <TestConsumer />
        </WishlistProvider>
      );
    }).not.toThrow();

    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('0');
  });

  it('correctly manages wishlist lifecycle: toggle, persist, remove, clear', () => {
    render(
      <WishlistProvider>
        <TestConsumer />
      </WishlistProvider>
    );

    // 1. Add item
    act(() => {
      screen.getByTestId('toggle-btn').click();
    });
    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('1');
    expect(screen.getByTestId('is-in-wishlist')).toHaveTextContent('YES');
    expect(screen.getByTestId('item-prod_test_001')).toBeInTheDocument();

    // 2. Toggle again to remove
    act(() => {
      screen.getByTestId('toggle-btn').click();
    });
    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('0');
    expect(screen.getByTestId('is-in-wishlist')).toHaveTextContent('NO');

    // 3. Add again and test clear
    act(() => {
      screen.getByTestId('toggle-btn').click();
    });
    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('1');

    act(() => {
      screen.getByTestId('clear-btn').click();
    });
    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('0');
  });
});
