import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SubcategoryBar from '../src/components/SubcategoryBar';

describe('Tier 1: Feature Coverage - SubcategoryBar Component', () => {
  it('renders all 10 canonical subcategory filter options', () => {
    render(<SubcategoryBar activeKey="all" onSelect={vi.fn()} />);

    expect(screen.getByTestId('filter-all')).toHaveTextContent('ALL');
    expect(screen.getByTestId('filter-dresses')).toHaveTextContent('DRESSES');
    expect(screen.getByTestId('filter-jumpsuits')).toHaveTextContent('JUMPSUITS');
    expect(screen.getByTestId('filter-party')).toHaveTextContent('PARTY');
    expect(screen.getByTestId('filter-wedding-guest')).toHaveTextContent('WEDDING GUEST');
    expect(screen.getByTestId('filter-office')).toHaveTextContent('OFFICE');
    expect(screen.getByTestId('filter-long')).toHaveTextContent('LONG');
    expect(screen.getByTestId('filter-midi')).toHaveTextContent('MIDI');
    expect(screen.getByTestId('filter-short')).toHaveTextContent('SHORT');
    expect(screen.getByTestId('filter-knitwear')).toHaveTextContent('KNITWEAR');
  });

  it('applies active styling to the currently selected subcategory', () => {
    render(<SubcategoryBar activeKey="party" onSelect={vi.fn()} />);

    const partyBtn = screen.getByTestId('filter-party');
    expect(partyBtn).toHaveClass('active');
    expect(partyBtn).toHaveClass('font-semibold');

    const dressesBtn = screen.getByTestId('filter-dresses');
    expect(dressesBtn).not.toHaveClass('active');
  });

  it('invokes onSelect callback with matching key when a subcategory is clicked', () => {
    const handleSelect = vi.fn();
    render(<SubcategoryBar activeKey="all" onSelect={handleSelect} />);

    const weddingGuestBtn = screen.getByTestId('filter-wedding-guest');
    fireEvent.click(weddingGuestBtn);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith('wedding-guest');
  });

  it('renders count badges when item counts are provided in subcategories', () => {
    const customSubcategories = [
      { key: 'all', label: 'ALL', count: 36 },
      { key: 'dresses', label: 'DRESSES', count: 12 },
    ];
    render(
      <SubcategoryBar
        subcategories={customSubcategories}
        activeKey="dresses"
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('(36)')).toBeInTheDocument();
    expect(screen.getByText('(12)')).toBeInTheDocument();
  });
});
