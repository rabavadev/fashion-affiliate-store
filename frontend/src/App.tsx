import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, GridViewMode, SubcategoryOption } from './types/product.types';
import { WishlistProvider, useWishlist } from './context/WishlistContext';
import { ViewProvider, useView } from './context/ViewContext';
import Header from './components/Header';
import SubcategoryBar, { DEFAULT_SUBCATEGORIES } from './components/SubcategoryBar';
import GridViewSwitcher from './components/GridViewSwitcher';
import ProductGrid from './components/ProductGrid';
import WishlistDrawer from './components/WishlistDrawer';
import SearchModal from './components/SearchModal';
import Footer from './components/Footer';
import { fetchProducts, computeSubcategoryFacetCounts } from './services/api';
import { checkAdminAuth, AdminUser } from './services/adminApi';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';

export interface AppProps {
  initialProducts?: Product[];
  initialRoute?: 'store' | 'admin';
}

const StorefrontContent: React.FC<AppProps> = ({ initialProducts, initialRoute }) => {
  // Routing State
  const [currentRoute, setCurrentRoute] = useState<'store' | 'admin'>(() => {
    if (initialRoute) return initialRoute;
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.startsWith('/admin') || hash === '#admin') return 'admin';
    }
    return 'store';
  });

  // Admin Auth State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // Storefront Catalog State
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts || []);
  const [activeSubcategory, setActiveSubcategory] = useState<string>('all');
  const [activeNav, setActiveNav] = useState<string>('COLLECTION');
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(!initialProducts);

  const { wishlist, toggleWishlist, removeFromWishlist, count: wishlistCount } = useWishlist();
  const { columns, effectiveColumns, setColumns } = useView();

  // Listen for browser popstate
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.startsWith('/admin') || hash === '#admin') {
        setCurrentRoute('admin');
      } else {
        setCurrentRoute('store');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check admin session on initial mount
  useEffect(() => {
    let isMounted = true;
    checkAdminAuth().then((user) => {
      if (isMounted) {
        setAdminUser(user);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const navigateTo = (route: 'store' | 'admin') => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined' && window.history) {
      const targetPath = route === 'admin' ? '/admin' : '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    }
  };

  const loadCatalog = useCallback(async () => {
    if (initialProducts) {
      setAllProducts(initialProducts);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetchProducts({ limit: 48 });
      setAllProducts(res.data);
    } catch {
      // Fallback handled in fetchProducts
    } finally {
      setLoading(false);
    }
  }, [initialProducts]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Compute facet counts dynamically
  const subcategoriesWithCounts: SubcategoryOption[] = useMemo(() => {
    return computeSubcategoryFacetCounts(allProducts, DEFAULT_SUBCATEGORIES);
  }, [allProducts]);

  // Client-side instant filtering without page reloads
  const filteredProducts = useMemo(() => {
    if (activeSubcategory === 'all') {
      return allProducts;
    }
    return allProducts.filter(
      (p) => p.subcategory?.toLowerCase() === activeSubcategory.toLowerCase()
    );
  }, [allProducts, activeSubcategory]);

  const handleToggleWishlist = (productId: string) => {
    const product = allProducts.find((p) => p.id === productId);
    if (product) {
      toggleWishlist(product);
    }
  };

  const handleNavSelect = (navItem: string) => {
    setActiveNav(navItem);
    if (navItem === 'DRESSES') {
      setActiveSubcategory('dresses');
    } else if (navItem === 'NEW') {
      setActiveSubcategory('all');
    } else if (navItem === 'COLLECTION') {
      setActiveSubcategory('all');
    }
  };

  // If on Admin Route
  if (currentRoute === 'admin') {
    if (!adminUser) {
      return (
        <AdminLogin
          onLoginSuccess={(user) => setAdminUser(user)}
          onReturnToStore={() => navigateTo('store')}
        />
      );
    }

    return (
      <AdminDashboard
        admin={adminUser}
        onLogout={() => setAdminUser(null)}
        onReturnToStore={() => navigateTo('store')}
        onProductCatalogMutated={loadCatalog}
      />
    );
  }

  // Public Storefront View
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111] flex flex-col font-sans">
      <Header
        wishlistCount={wishlistCount}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAdmin={() => navigateTo('admin')}
        activeNav={activeNav}
        onSelectNav={handleNavSelect}
      />

      <SubcategoryBar
        subcategories={subcategoriesWithCounts}
        activeKey={activeSubcategory}
        onSelect={(key) => setActiveSubcategory(key)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Editorial Subcategory Title & Grid Switcher Bar */}
        <div className="flex flex-col sm:flex-row items-baseline justify-between pb-6 mb-6 border-b border-[#E5E5E5] gap-4">
          <div>
            <h1 className="text-xl uppercase tracking-widest font-light text-[#111111]">
              {activeSubcategory.replace('-', ' ')}
            </h1>
            <p className="text-xs text-[#767676] mt-1">
              Showing {filteredProducts.length} pieces
            </p>
          </div>

          <GridViewSwitcher
            columns={columns}
            onChange={(cols: GridViewMode) => setColumns(cols)}
          />
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="py-24 text-center text-xs uppercase tracking-widest text-[#767676]">
            Loading collection...
          </div>
        ) : (
          <ProductGrid
            products={filteredProducts}
            columns={effectiveColumns}
            wishlistIds={wishlist.map((w) => w.id)}
            onToggleWishlist={handleToggleWishlist}
          />
        )}
      </main>

      <Footer />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        items={wishlist}
        onRemove={removeFromWishlist}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={allProducts}
      />
    </div>
  );
};

export const App: React.FC<AppProps> = (props) => {
  return (
    <WishlistProvider>
      <ViewProvider defaultColumns={4}>
        <StorefrontContent {...props} />
      </ViewProvider>
    </WishlistProvider>
  );
};

export default App;
