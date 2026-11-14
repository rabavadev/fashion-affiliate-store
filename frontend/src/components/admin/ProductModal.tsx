import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Product } from '../../types/product.types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Record<string, unknown>) => Promise<void>;
  product?: Product | null;
}

const SUBCATEGORY_OPTIONS = [
  'dresses',
  'jumpsuits',
  'party',
  'wedding-guest',
  'office',
  'long',
  'midi',
  'short',
  'knitwear',
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [subcategory, setSubcategory] = useState('dresses');
  const [price, setPrice] = useState<number | string>(129.99);
  const [originalPrice, setOriginalPrice] = useState<number | string>('');
  const [retailerName, setRetailerName] = useState('MANGO');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [primaryImage, setPrimaryImage] = useState('');
  const [secondaryImage, setSecondaryImage] = useState('');
  const [tags, setTags] = useState('NEW NOW, EDITORIAL');
  const [description, setDescription] = useState('');
  const [composition, setComposition] = useState('');
  const [inStock, setInStock] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setTitle(product.title);
      setSubtitle(product.subtitle || '');
      setSubcategory(product.subcategory || 'dresses');
      setPrice(product.price);
      setOriginalPrice(product.originalPrice || '');
      setRetailerName(product.retailer?.name || 'MANGO');
      setAffiliateUrl(product.affiliate?.directTarget || '');
      setPrimaryImage(product.images?.primary || '');
      setSecondaryImage(product.images?.secondary || '');
      setTags((product.tags || []).join(', '));
      setDescription(product.description || '');
      setComposition(product.composition || '');
      setInStock(product.inStock !== false);
    } else {
      // Default placeholder values for convenient testing
      setTitle('');
      setSubtitle('Editorial Selection');
      setSubcategory('dresses');
      setPrice(149.99);
      setOriginalPrice(189.99);
      setRetailerName('MANGO');
      setAffiliateUrl('https://shop.mango.com/us/women/dresses/editorial-dress.html');
      setPrimaryImage('https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80');
      setSecondaryImage('https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=80');
      setTags('NEW NOW, EDITORIAL');
      setDescription('Fluid fabric with minimalist clean tailoring.');
      setComposition('100% Lyocell');
      setInStock(true);
    }
    setError(null);
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Price must be a valid positive number');
      return;
    }

    if (!primaryImage.startsWith('http')) {
      setError('Primary image must be a valid HTTPS URL');
      return;
    }

    if (!affiliateUrl.startsWith('https://')) {
      setError('Affiliate direct target must be a secure HTTPS URL');
      return;
    }

    const payload: Record<string, unknown> = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      category: 'clothing',
      subcategory: subcategory.trim(),
      price: parsedPrice,
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      currency: 'USD',
      retailerName: retailerName.trim(),
      affiliateUrl: affiliateUrl.trim(),
      primaryImage: primaryImage.trim(),
      secondaryImage: (secondaryImage.trim() || primaryImage.trim()),
      tags: tags
        .split(',')
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean),
      description: description.trim(),
      composition: composition.trim(),
      inStock,
    };

    try {
      setSaving(true);
      await onSave(payload);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save product';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E5E5] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
          <h2 className="text-sm uppercase tracking-[0.2em] font-medium text-[#111111]">
            {product ? `Edit Product: ${product.title}` : 'Create New Catalog Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#767676] hover:text-[#111111] p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#767676] mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Silk midi slip dress"
                className="w-full px-3 py-2 border border-[#CCCCCC] focus:border-[#111111] focus:outline-none text-xs bg-transparent"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#767676] mb-1">
                Subtitle
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Selection Exclusive"
                className="w-full px-3 py-2 border border-[#CCCCCC] focus:border-[#111111] focus:outline-none text-xs bg-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#767676] mb-1">
                Subcategory *
              </label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-3 py-2 border border-[#CCCCCC] focus:border-[#111111] focus:outline-none text-xs bg-transparent capitalize"
              >
                {SUBCATEGORY_OPTIONS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#767676] mb-1">
                Price ($ USD) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="129.99"
                className="w-full px-3 py-2 border border-[#CCCCCC] focus:border-[#111111] focus:outline-none text-xs bg-transparent"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#767676] mb-1">
                Original Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="159.99"
                className="w-full px-3 py-2 border border-[#CCCCCC] focus:border-[#111111] focus:outline-none text-xs bg-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#767676] mb-1">
                Retailer Name *
              </label>
              <input
                type="text"
                required
                value={retailerName}
                onChange={(e) => setRetailerName(e.target.value)}
                placeholder="MANGO"
                className="w-full px-3 py-2 border border-[#CCCCCC] focus:border-[#111111] focus:outline-none text-xs bg-transparent"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#767676] mb-1">
                Affiliate Target URL *
              </label>
              <input
                type="url"
                required
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                placeholder="https://shop.mango.com/us/women/dresses/..."
                className="w-full px-3 py-2 border border-[#CCCCCC] focus:border-[#111111] focus:outline-none text-xs bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest text-[#767676] mb-1">
              Primary Image URL *
            </label>
            <input
              type="url"
              required
              value={primaryImage}
              onChange={(e) => setPrimaryImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 border border-[#CCCCCC] focus:border-[#111111] focus:outline-none text-xs bg-transparent"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest text-[#767676] mb-1">
              Secondary Image URL
            </label>
            <input
              type="url"
              value={secondaryImage}
              onChange={(e) => setSecondaryImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 border border-[#CCCCCC] focus:border-[#111111] focus:outline-none text-xs bg-transparent"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest text-[#767676] mb-1">
              Tags (Comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="NEW NOW, BESTSELLER, SILK"
              className="w-full px-3 py-2 border border-[#CCCCCC] focus:border-[#111111] focus:outline-none text-xs bg-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#767676] mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Minimalist editorial product description..."
                className="w-full px-3 py-2 border border-[#CCCCCC] focus:border-[#111111] focus:outline-none text-xs bg-transparent"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#767676] mb-1">
                Composition
              </label>
              <textarea
                rows={2}
                value={composition}
                onChange={(e) => setComposition(e.target.value)}
                placeholder="e.g. 100% Silk Mulberry"
                className="w-full px-3 py-2 border border-[#CCCCCC] focus:border-[#111111] focus:outline-none text-xs bg-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="inStockCheck"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              className="w-4 h-4 accent-[#111111]"
            />
            <label htmlFor="inStockCheck" className="text-xs uppercase tracking-wider text-[#111111] cursor-pointer">
              Mark as In Stock & Active in Public Storefront
            </label>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-[#E5E5E5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#CCCCCC] text-xs uppercase tracking-widest hover:border-[#111111] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#111111] text-[#FAFAFA] text-xs uppercase tracking-widest font-medium hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
