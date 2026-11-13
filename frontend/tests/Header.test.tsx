import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from '../src/components/Header';

describe('Tier 1: Feature Coverage - Header Component', () => {
  it('renders centered minimalist brand typography logo (MANGO)', () => {
    render(<Header />);
    const logo = screen.getByLabelText('MANGO Home');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveTextContent('MANGO');
  });

  it('renders category navigation links (NEW, COLLECTION, DRESSES, EDITORIAL)', () => {
    render(<Header activeNav="COLLECTION" />);
    expect(screen.getByText('NEW')).toBeInTheDocument();
    expect(screen.getByText('COLLECTION')).toBeInTheDocument();
    expect(screen.getByText('DRESSES')).toBeInTheDocument();
    expect(screen.getByText('EDITORIAL')).toBeInTheDocument();
  });

  it('renders Wishlist toggle button without badge when count is 0', () => {
    render(<Header wishlistCount={0} />);
    const wishlistBtn = screen.getByTestId('wishlist-toggle');
    expect(wishlistBtn).toBeInTheDocument();
    expect(screen.queryByTestId('wishlist-count')).toBeNull();
  });

  it('renders Wishlist counter badge with exact count when wishlistCount > 0', () => {
    render(<Header wishlistCount={3} />);
    const badge = screen.getByTestId('wishlist-count');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('3');
  });

  it('invokes onOpenWishlist callback when wishlist button is clicked', () => {
    const handleOpen = vi.fn();
    render(<Header onOpenWishlist={handleOpen} />);
    const wishlistBtn = screen.getByTestId('wishlist-toggle');
    fireEvent.click(wishlistBtn);
    expect(handleOpen).toHaveBeenCalledTimes(1);
  });

  it('invokes onOpenSearch callback when search icon is clicked', () => {
    const handleSearch = vi.fn();
    render(<Header onOpenSearch={handleSearch} />);
    const searchBtn = screen.getByTestId('search-toggle');
    fireEvent.click(searchBtn);
    expect(handleSearch).toHaveBeenCalledTimes(1);
  });

  it('invokes onSelectNav when a navigation link is clicked', () => {
    const handleSelect = vi.fn();
    render(<Header onSelectNav={handleSelect} />);
    fireEvent.click(screen.getByText('DRESSES'));
    expect(handleSelect).toHaveBeenCalledWith('DRESSES');
  });
});
