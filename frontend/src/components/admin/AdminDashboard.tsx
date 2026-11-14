import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  MousePointerClick,
  Store,
  ShieldCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Product } from '../../types/product.types';
import {
  AdminUser,
  AdminAnalyticsData,
  WhitelistItem,
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  fetchAdminWhitelist,
  addAdminWhitelistDomain,
  deleteAdminWhitelistDomain,
  fetchAdminAnalytics,
  logoutAdmin,
} from '../../services/adminApi';
import ProductModal from './ProductModal';

interface AdminDashboardProps {
  admin: AdminUser;
  onLogout: () => void;
  onReturnToStore: () => void;
  onProductCatalogMutated?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  admin,
  onLogout,
  onReturnToStore,
  onProductCatalogMutated,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'analytics' | 'whitelist'>('products');

  // Analytics & Summary State
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);

  // Products CRM State
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productPage, setProductPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [selectedStock, setSelectedStock] = useState<'all' | 'inStock' | 'outOfStock'>('all');
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Whitelist State
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [domainError, setDomainError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Global notification banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load Metrics & Analytics
  const loadAnalytics = useCallback(async () => {
    try {
      const data = await fetchAdminAnalytics();
      setAnalytics(data);
    } catch (err: unknown) {
      console.error('Failed to load analytics', err);
    }
  }, []);

  // Load Products
  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      let inStock: boolean | undefined = undefined;
      if (selectedStock === 'inStock') inStock = true;
      else if (selectedStock === 'outOfStock') inStock = false;

      const res = await fetchAdminProducts({
        search: searchQuery,
        subcategory: selectedSubcategory,
        inStock,
        page: productPage,
        limit: 15,
      });
      setProducts(res.data);
      setTotalProducts(res.total);
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Error fetching products');
    } finally {
      setLoadingProducts(false);
    }
  }, [searchQuery, selectedSubcategory, selectedStock, productPage]);

  // Load Whitelist
  const loadWhitelist = useCallback(async () => {
    try {
      const items = await fetchAdminWhitelist();
      setWhitelist(items);
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Error loading whitelist');
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
    loadProducts();
    loadWhitelist();
  }, [loadAnalytics, loadProducts, loadWhitelist]);

  // Handle Product Save (Create or Update)
  const handleSaveProduct = async (productData: Record<string, unknown>) => {
    if (editingProduct) {
      await updateAdminProduct(editingProduct.id, productData);
      showNotification('success', `Product "${productData.title}" updated successfully.`);
    } else {
      await createAdminProduct(productData);
      showNotification('success', `Product "${productData.title}" created and published.`);
    }
    loadProducts();
    loadAnalytics();
    onProductCatalogMutated?.();
  };

  // Handle Product Delete
  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.title}"?`)) return;

    try {
      await deleteAdminProduct(product.id);
      showNotification('success', `Product "${product.title}" deleted.`);
      loadProducts();
      loadAnalytics();
      onProductCatalogMutated?.();
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  // Handle Add Domain Whitelist
  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setDomainError(null);
    if (!newDomain.trim()) return;

    try {
      await addAdminWhitelistDomain(newDomain.trim());
      setNewDomain('');
      showNotification('success', `Domain "${newDomain.trim()}" added to whitelist.`);
      loadWhitelist();
      loadAnalytics();
    } catch (err: unknown) {
      setDomainError(err instanceof Error ? err.message : 'Failed to add domain');
    }
  };

  // Handle Delete Domain Whitelist
  const handleDeleteDomain = async (item: WhitelistItem) => {
    if (!window.confirm(`Remove "${item.domain}" from outbound redirect whitelist?`)) return;

    try {
      await deleteAdminWhitelistDomain(item.id);
      showNotification('success', `Domain "${item.domain}" removed from whitelist.`);
      loadWhitelist();
      loadAnalytics();
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Failed to delete domain');
    }
  };

  const handleLogoutClick = async () => {
    await logoutAdmin();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#111111] font-sans flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-white border-b border-[#E5E5E5] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <span className="font-serif text-xl tracking-[0.2em] font-light uppercase">
                MANGO
              </span>
              <span className="text-[11px] uppercase tracking-[0.25em] bg-[#111111] text-white px-2 py-0.5 font-medium">
                CRM
              </span>
            </div>

            <div className="flex items-center space-x-4 text-xs">
              <span className="text-[#767676] hidden sm:inline">
                Signed in as <strong className="text-[#111111] font-mono">{admin.username}</strong>
              </span>

              <button
                onClick={onReturnToStore}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#CCCCCC] hover:border-[#111111] text-[11px] uppercase tracking-wider transition-colors"
                title="View Public Storefront"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Storefront
              </button>

              <button
                onClick={handleLogoutClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] text-white text-[11px] uppercase tracking-wider hover:bg-black transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`py-2 px-4 text-center text-xs tracking-wide transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-800 text-white'
              : 'bg-red-800 text-white'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Editorial Metrics Bar */}
        <section aria-label="CRM Key Metrics">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="bg-white p-5 border border-[#E5E5E5] shadow-xs">
              <div className="flex items-center justify-between text-[#767676] mb-2">
                <span className="text-[11px] uppercase tracking-[0.18em]">Total Products</span>
                <Package className="w-4 h-4" />
              </div>
              <div className="text-2xl font-light tracking-tight text-[#111111]">
                {analytics?.summary.totalProducts ?? totalProducts}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[#767676] mt-1">
                Persistent in SQLite
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white p-5 border border-[#E5E5E5] shadow-xs">
              <div className="flex items-center justify-between text-[#767676] mb-2">
                <span className="text-[11px] uppercase tracking-[0.18em]">Affiliate Clicks</span>
                <MousePointerClick className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-light tracking-tight text-[#111111]">
                {analytics?.summary.totalClicks ?? 0}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[#767676] mt-1">
                Hashed IP Outbound Events
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white p-5 border border-[#E5E5E5] shadow-xs">
              <div className="flex items-center justify-between text-[#767676] mb-2">
                <span className="text-[11px] uppercase tracking-[0.18em]">Active Retailers</span>
                <Store className="w-4 h-4" />
              </div>
              <div className="text-2xl font-light tracking-tight text-[#111111]">
                {analytics?.summary.activeRetailers ?? 7}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[#767676] mt-1">
                MANGO, Nordstrom, etc.
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-white p-5 border border-[#E5E5E5] shadow-xs">
              <div className="flex items-center justify-between text-[#767676] mb-2">
                <span className="text-[11px] uppercase tracking-[0.18em]">Whitelisted Domains</span>
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-light tracking-tight text-[#111111]">
                {analytics?.summary.whitelistedDomains ?? whitelist.length}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[#767676] mt-1">
                Zero-Trust Boundaries
              </div>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E5E5E5] space-x-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 text-xs uppercase tracking-[0.2em] transition-colors relative ${
              activeTab === 'products'
                ? 'text-[#111111] font-medium border-b-2 border-[#111111]'
                : 'text-[#767676] hover:text-[#111111]'
            }`}
          >
            Product Catalog Management
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 text-xs uppercase tracking-[0.2em] transition-colors relative ${
              activeTab === 'analytics'
                ? 'text-[#111111] font-medium border-b-2 border-[#111111]'
                : 'text-[#767676] hover:text-[#111111]'
            }`}
          >
            Affiliate Analytics & Clicks
          </button>

          <button
            onClick={() => setActiveTab('whitelist')}
            className={`pb-3 text-xs uppercase tracking-[0.2em] transition-colors relative ${
              activeTab === 'whitelist'
                ? 'text-[#111111] font-medium border-b-2 border-[#111111]'
                : 'text-[#767676] hover:text-[#111111]'
            }`}
          >
            Domain Whitelist Settings
          </button>
        </div>

        {/* TAB 1: PRODUCT CATALOG MANAGEMENT */}
        {activeTab === 'products' && (
          <section className="space-y-4">
            {/* Filter & Action Controls */}
            <div className="bg-white p-4 border border-[#E5E5E5] flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#767676]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setProductPage(1);
                    }}
                    placeholder="Search products by title, retailer, ID..."
                    className="w-full pl-9 pr-3 py-2 border border-[#CCCCCC] focus:border-[#111111] focus:outline-none text-xs bg-transparent"
                  />
                </div>

                {/* Subcategory */}
                <select
                  value={selectedSubcategory}
                  onChange={(e) => {
                    setSelectedSubcategory(e.target.value);
                    setProductPage(1);
                  }}
                  className="px-3 py-2 border border-[#CCCCCC] focus:border-[#111111] focus:outline-none text-xs bg-transparent uppercase"
                >
                  <option value="all">ALL SUBCATEGORIES</option>
                  <option value="dresses">Dresses</option>
                  <option value="jumpsuits">Jumpsuits</option>
                  <option value="party">Party</option>
                  <option value="wedding-guest">Wedding Guest</option>
                  <option value="office">Office</option>
                  <option value="long">Long</option>
                  <option value="midi">Midi</option>
                  <option value="short">Short</option>
                  <option value="knitwear">Knitwear</option>
                </select>

                {/* Stock status */}
                <select
                  value={selectedStock}
                  onChange={(e) => {
                    setSelectedStock(e.target.value as 'all' | 'inStock' | 'outOfStock');
                    setProductPage(1);
                  }}
                  className="px-3 py-2 border border-[#CCCCCC] focus:border-[#111111] focus:outline-none text-xs bg-transparent uppercase"
                >
                  <option value="all">ALL STOCK</option>
                  <option value="inStock">In Stock Only</option>
                  <option value="outOfStock">Out of Stock Only</option>
                </select>
              </div>

              {/* Create Product Button */}
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsModalOpen(true);
                }}
                className="w-full md:w-auto px-5 py-2.5 bg-[#111111] text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-black transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Create New Product
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-white border border-[#E5E5E5] overflow-x-auto">
              {loadingProducts ? (
                <div className="py-16 text-center text-xs uppercase tracking-widest text-[#767676]">
                  Loading catalog database...
                </div>
              ) : products.length === 0 ? (
                <div className="py-16 text-center text-xs uppercase tracking-widest text-[#767676]">
                  No products matched your criteria.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E5E5] bg-[#F9F9F9] text-[#767676] uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-4">Title & Subtitle</th>
                      <th className="py-3 px-4">Subcategory</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Retailer</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAFAFA] transition-colors">
                        <td className="py-2.5 px-4">
                          <img
                            src={p.images?.primary}
                            alt={p.title}
                            className="w-10 h-14 object-cover bg-[#E5E5E5]"
                          />
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-[#111111]">{p.title}</div>
                          <div className="text-[10px] text-[#767676]">{p.subtitle || p.id}</div>
                        </td>
                        <td className="py-2.5 px-4 capitalize">
                          <span className="px-2 py-0.5 bg-[#F0F0F0] text-[10px] tracking-wider uppercase">
                            {p.subcategory}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-medium">
                          ${p.price.toFixed(2)}
                          {p.originalPrice && (
                            <span className="text-[#999999] line-through ml-1.5 font-normal text-[10px]">
                              ${p.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-[#767676]">
                          {p.retailer?.name || 'MANGO'}
                        </td>
                        <td className="py-2.5 px-4">
                          {p.inStock ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              In Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-[11px]">
                              <XCircle className="w-3.5 h-3.5" />
                              Out of Stock
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right space-x-2">
                          <a
                            href={p.affiliate?.redirectPath || `/api/v1/redirect/${p.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block p-1.5 text-[#767676] hover:text-[#111111]"
                            title="Test Affiliate Redirection"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-[#767676] hover:text-[#111111]"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 text-red-600 hover:text-red-800"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Pagination bar */}
              <div className="py-3 px-4 border-t border-[#E5E5E5] flex items-center justify-between text-xs text-[#767676]">
                <div>
                  Showing {products.length} of {totalProducts} products
                </div>
                <div className="space-x-2">
                  <button
                    disabled={productPage <= 1}
                    onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 border border-[#CCCCCC] disabled:opacity-30 uppercase tracking-widest text-[10px]"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-xs">Page {productPage}</span>
                  <button
                    disabled={products.length < 15}
                    onClick={() => setProductPage((p) => p + 1)}
                    className="px-3 py-1 border border-[#CCCCCC] disabled:opacity-30 uppercase tracking-widest text-[10px]"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: AFFILIATE ANALYTICS & CLICKS */}
        {activeTab === 'analytics' && (
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-[#111111]">
                Outbound Performance & Realtime Click Stream
              </h3>
              <button
                onClick={loadAnalytics}
                className="text-xs uppercase tracking-wider text-[#767676] hover:text-[#111111] flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            {/* Top Products & Retailer Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <div className="bg-white p-5 border border-[#E5E5E5]">
                <h4 className="text-[11px] uppercase tracking-[0.18em] font-medium text-[#767676] mb-4">
                  Top Converting Outbound Products
                </h4>
                {analytics?.topProducts && analytics.topProducts.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topProducts.map((tp) => (
                      <div
                        key={tp.id}
                        className="flex items-center justify-between py-2 border-b border-[#F0F0F0] text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={tp.primary_image}
                            alt={tp.title}
                            className="w-8 h-10 object-cover bg-gray-100"
                          />
                          <div>
                            <div className="font-medium text-[#111111]">{tp.title}</div>
                            <div className="text-[10px] text-[#767676]">{tp.retailer_name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-medium text-[#111111] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[11px]">
                            {tp.click_count} clicks
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-[#767676] tracking-wider uppercase">
                    No clicks recorded yet.
                  </div>
                )}
              </div>

              {/* Clicks By Retailer */}
              <div className="bg-white p-5 border border-[#E5E5E5]">
                <h4 className="text-[11px] uppercase tracking-[0.18em] font-medium text-[#767676] mb-4">
                  Clicks by Retailer Partner
                </h4>
                {analytics?.clicksByRetailer && analytics.clicksByRetailer.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.clicksByRetailer.map((ret) => (
                      <div
                        key={ret.retailer_name}
                        className="flex items-center justify-between py-2 border-b border-[#F0F0F0] text-xs"
                      >
                        <span className="font-medium text-[#111111]">{ret.retailer_name}</span>
                        <span className="font-mono text-[#767676]">{ret.count} referral visits</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-[#767676] tracking-wider uppercase">
                    No retailer click distribution data.
                  </div>
                )}
              </div>
            </div>

            {/* Click Stream Table */}
            <div className="bg-white border border-[#E5E5E5]">
              <div className="p-4 border-b border-[#E5E5E5]">
                <h4 className="text-[11px] uppercase tracking-[0.18em] font-medium text-[#111111]">
                  Recent Outbound Click Stream (Audit Trail)
                </h4>
              </div>
              <div className="overflow-x-auto">
                {analytics?.recentClicks && analytics.recentClicks.length > 0 ? (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E5E5] bg-[#F9F9F9] text-[#767676] uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Product ID / Title</th>
                        <th className="py-3 px-4">Retailer</th>
                        <th className="py-3 px-4">Sanitized Destination URL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5]">
                      {analytics.recentClicks.map((click) => (
                        <tr key={click.id} className="hover:bg-[#FAFAFA]">
                          <td className="py-2.5 px-4 font-mono text-[11px] text-[#767676]">
                            {new Date(click.clicked_at).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-[#111111]">
                            {click.product_title || click.product_id || 'Direct URL'}
                          </td>
                          <td className="py-2.5 px-4 text-[#767676]">{click.retailer_name}</td>
                          <td className="py-2.5 px-4 font-mono text-[10px] text-[#767676] max-w-xs truncate">
                            {click.destination_url}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-12 text-center text-xs uppercase tracking-widest text-[#767676]">
                    No outbound clicks logged yet.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: DOMAIN WHITELIST SETTINGS */}
        {activeTab === 'whitelist' && (
          <section className="space-y-6">
            <div className="bg-white p-6 border border-[#E5E5E5]">
              <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-[#111111] mb-2">
                Dynamic Outbound Whitelist Management
              </h3>
              <p className="text-xs text-[#767676] mb-6">
                All external retailer affiliate redirects must match an approved domain or dot-boundary subdomain in SQLite.
              </p>

              {domainError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
                  {domainError}
                </div>
              )}

              {/* Add domain form */}
              <form onSubmit={handleAddDomain} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  required
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="e.g. partner-boutique.com"
                  className="flex-1 px-3 py-2 border border-[#CCCCCC] focus:border-[#111111] focus:outline-none text-xs bg-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#111111] text-white text-xs uppercase tracking-widest font-medium hover:bg-black transition-colors whitespace-nowrap"
                >
                  Add To Whitelist
                </button>
              </form>
            </div>

            {/* Whitelisted Domains Table */}
            <div className="bg-white border border-[#E5E5E5] overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#F9F9F9] text-[#767676] uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Approved Host / Domain</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Added On</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {whitelist.map((w) => (
                    <tr key={w.id} className="hover:bg-[#FAFAFA]">
                      <td className="py-2.5 px-4 font-mono font-medium text-[#111111]">
                        {w.domain}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[10px] uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[10px] text-[#767676]">
                        {new Date(w.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteDomain(w)}
                          className="p-1.5 text-red-600 hover:text-red-800"
                          title="Remove Domain"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Product Create / Edit Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
      />
    </div>
  );
};

export default AdminDashboard;
