import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminLogin from '../src/components/admin/AdminLogin';
import AdminDashboard from '../src/components/admin/AdminDashboard';
import ProductModal from '../src/components/admin/ProductModal';

describe('Admin CRM & Dashboard Frontend Components', () => {
  describe('AdminLogin Component', () => {
    it('renders login form with pre-seeded administrator hint', () => {
      const handleSuccess = vi.fn();
      const handleReturn = vi.fn();

      render(<AdminLogin onLoginSuccess={handleSuccess} onReturnToStore={handleReturn} />);

      expect(screen.getByText('CRM & Catalog Administration')).toBeInTheDocument();
      expect(screen.getByLabelText(/Username/i) || screen.getByPlaceholderText('admin')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••••••')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign In To CRM/i })).toBeInTheDocument();
      expect(screen.getByText(/Pre-seeded Administrator Credentials/i)).toBeInTheDocument();
    });

    it('triggers return to store callback when Return to Boutique is clicked', () => {
      const handleReturn = vi.fn();
      render(<AdminLogin onLoginSuccess={vi.fn()} onReturnToStore={handleReturn} />);

      const returnBtn = screen.getByText(/Return to Boutique/i);
      fireEvent.click(returnBtn);
      expect(handleReturn).toHaveBeenCalledTimes(1);
    });
  });

  describe('ProductModal Component', () => {
    it('renders product creation modal inputs and validates fields', () => {
      const handleClose = vi.fn();
      const handleSave = vi.fn();

      render(
        <ProductModal
          isOpen={true}
          onClose={handleClose}
          onSave={handleSave}
          product={null}
        />
      );

      expect(screen.getByText(/Create New Catalog Product/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\. Silk midi slip dress/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('129.99')).toBeInTheDocument();
      expect(screen.getByText(/Mark as In Stock & Active in Public Storefront/i)).toBeInTheDocument();
    });
  });

  describe('AdminDashboard Component', () => {
    const mockAdmin = { id: 'admin_root_1', username: 'admin' };

    it('renders CRM Header, signed in indicator, and metrics bar', async () => {
      render(
        <AdminDashboard
          admin={mockAdmin}
          onLogout={vi.fn()}
          onReturnToStore={vi.fn()}
        />
      );

      expect(screen.getByText('CRM')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('Total Products')).toBeInTheDocument();
      expect(screen.getByText('Affiliate Clicks')).toBeInTheDocument();
      expect(screen.getByText('Active Retailers')).toBeInTheDocument();
      expect(screen.getByText('Whitelisted Domains')).toBeInTheDocument();
    });

    it('switches between CRM tabs', async () => {
      render(
        <AdminDashboard
          admin={mockAdmin}
          onLogout={vi.fn()}
          onReturnToStore={vi.fn()}
        />
      );

      const analyticsTab = screen.getByText('Affiliate Analytics & Clicks');
      fireEvent.click(analyticsTab);
      expect(screen.getByText(/Outbound Performance & Realtime Click Stream/i)).toBeInTheDocument();

      const whitelistTab = screen.getByText('Domain Whitelist Settings');
      fireEvent.click(whitelistTab);
      expect(screen.getByText(/Dynamic Outbound Whitelist Management/i)).toBeInTheDocument();
    });
  });
});
