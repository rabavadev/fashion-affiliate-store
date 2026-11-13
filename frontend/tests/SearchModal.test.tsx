import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchModal from '../src/components/SearchModal';
import { Product } from '../src/types/product.types';

const mockProducts: Product[] = [
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
    slug: 'linen-tailored-jumpsuit',
    title: 'Linen tailored jumpsuit',
    category: 'clothing',
    subcategory: 'jumpsuits',
    tags: ['BESTSELLER'],
    price: 149.99,
    currency: 'USD',
    images: {
      primary: 'https://images.unsplash.com/jumpsuit-1.jpg',
      secondary: 'https://images.unsplash.com/jumpsuit-1-hover.jpg',
    },
    affiliate: {
      redirectPath: '/api/v1/redirect/prod_mango_002',
      directTarget: 'https://shop.mango.com/item2',
      partner: 'Rakuten',
    },
  },
];

describe('Tier 1: Feature Coverage - SearchModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <SearchModal isOpen={false} onClose={vi.fn()} products={mockProducts} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders search input when isOpen is true', () => {
    render(<SearchModal isOpen={true} onClose={vi.fn()} products={mockProducts} />);
    expect(screen.getByTestId('search-modal')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('filters products instantly as user types query', () => {
    render(<SearchModal isOpen={true} onClose={vi.fn()} products={mockProducts} />);
    const input = screen.getByTestId('search-input');

    fireEvent.change(input, { target: { value: 'linen' } });

    expect(screen.getByText('Linen tailored jumpsuit')).toBeInTheDocument();
    expect(screen.queryByText('Pleated satin midi dress')).toBeNull();
    expect(screen.getByText(/Found 1 garment/i)).toBeInTheDocument();
  });

  it('shows no-results message when query does not match', () => {
    render(<SearchModal isOpen={true} onClose={vi.fn()} products={mockProducts} />);
    const input = screen.getByTestId('search-input');

    fireEvent.change(input, { target: { value: 'nonexistent garment xyz' } });

    expect(screen.getByTestId('search-no-results')).toBeInTheDocument();
  });

  it('invokes onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<SearchModal isOpen={true} onClose={handleClose} products={mockProducts} />);

    fireEvent.click(screen.getByTestId('close-search'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
