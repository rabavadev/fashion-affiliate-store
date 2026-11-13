import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GridViewSwitcher from '../src/components/GridViewSwitcher';

describe('Tier 1: Feature Coverage - GridViewSwitcher Component', () => {
  it('renders all 4 column view buttons (1, 2, 3, 4)', () => {
    render(<GridViewSwitcher columns={4} onChange={vi.fn()} />);

    expect(screen.getByTestId('view-1-btn')).toBeInTheDocument();
    expect(screen.getByTestId('view-2-btn')).toBeInTheDocument();
    expect(screen.getByTestId('view-3-btn')).toBeInTheDocument();
    expect(screen.getByTestId('view-4-btn')).toBeInTheDocument();
  });

  it('marks active view button with active styling', () => {
    render(<GridViewSwitcher columns={2} onChange={vi.fn()} />);

    const view2 = screen.getByTestId('view-2-btn');
    expect(view2).toHaveClass('bg-neutral-900');
    expect(view2).toHaveClass('text-white');

    const view4 = screen.getByTestId('view-4-btn');
    expect(view4).not.toHaveClass('bg-neutral-900');
  });

  it('invokes onChange with requested column number when clicked', () => {
    const handleChange = vi.fn();
    render(<GridViewSwitcher columns={4} onChange={handleChange} />);

    fireEvent.click(screen.getByTestId('view-2-btn'));
    expect(handleChange).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByTestId('view-1-btn'));
    expect(handleChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByTestId('view-3-btn'));
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('provides descriptive aria-labels for accessibility', () => {
    render(<GridViewSwitcher columns={4} onChange={vi.fn()} />);

    expect(screen.getByLabelText('Switch to 1 column grid')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch to 2 column grid')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch to 3 column grid')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch to 4 column grid')).toBeInTheDocument();
  });
});
