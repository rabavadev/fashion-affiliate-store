import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from '../src/components/Footer';

describe('Tier 1: Feature Coverage - Footer Component', () => {
  it('renders brand name and editorial manifesto', () => {
    render(<Footer />);
    expect(screen.getByTestId('store-footer')).toBeInTheDocument();
    expect(screen.getByText('MANGO')).toBeInTheDocument();
    expect(
      screen.getByText(/Curated contemporary silhouettes designed for effortless elegance/i)
    ).toBeInTheDocument();
  });

  it('renders affiliate disclosure text', () => {
    render(<Footer />);
    const disclosure = screen.getByTestId('affiliate-disclosure');
    expect(disclosure).toBeInTheDocument();
    expect(disclosure).toHaveTextContent(/This catalog features handpicked editorial selections/i);
    expect(disclosure).toHaveTextContent(/qualifying purchase/i);
  });

  it('renders navigation categories and current copyright notice', () => {
    render(<Footer />);
    expect(screen.getByText('The Edit')).toBeInTheDocument();
    expect(screen.getByText('Customer Care')).toBeInTheDocument();
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(String(currentYear)))).toBeInTheDocument();
  });
});
