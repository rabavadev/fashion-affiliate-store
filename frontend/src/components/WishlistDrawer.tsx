import React from 'react';
import { X, Trash2, ExternalLink } from 'lucide-react';
import { Product } from '../types/product.types';

export interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: Product[];
  onRemove: (productId: string) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onRemove,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      aria-labelledby="wishlist-drawer-title"
      role="dialog"
      aria-modal="true"
      data-testid="wishlist-drawer"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
        data-testid="wishlist-backdrop"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h2
                id="wishlist-drawer-title"
                className="text-sm uppercase tracking-widest font-medium text-neutral-900"
              >
                Wishlist
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {items.length} {items.length === 1 ? 'item saved' : 'items saved'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Wishlist"
              data-testid="close-wishlist"
              className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div
                className="h-full flex flex-col items-center justify-center text-center py-12"
                data-testid="wishlist-empty-state"
              >
                <p className="text-xs uppercase tracking-widest text-neutral-400">
                  Your wishlist is empty
                </p>
                <p className="text-xs text-neutral-500 mt-2 max-w-xs">
                  Save pieces from the collection to revisit or complete your purchase on retailer sites.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100" data-testid="wishlist-items-list">
                {items.map((item) => (
                  <li key={item.id} className="py-4 flex space-x-4">
                    <img
                      src={item.images?.primary}
                      alt={item.title}
                      className="w-20 h-24 object-cover bg-neutral-100 flex-shrink-0"
                    />

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-medium text-neutral-900 truncate">
                          {item.title}
                        </h4>
                        <p className="text-xs text-neutral-500 mt-1">
                          ${item.price.toFixed(2)} USD
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 mt-3">
                        <a
                          href={item.affiliate?.redirectPath || `/api/v1/redirect/${item.id}`}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          data-testid="drawer-affiliate-link"
                          className="inline-flex items-center text-[11px] uppercase tracking-wider text-neutral-900 font-medium hover:underline"
                        >
                          BUY NOW <ExternalLink className="w-3 h-3 ml-1" />
                        </a>

                        <button
                          type="button"
                          onClick={() => onRemove(item.id)}
                          data-testid={`remove-${item.id}`}
                          aria-label={`Remove ${item.title}`}
                          className="text-[11px] text-neutral-400 hover:text-red-600 flex items-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistDrawer;
