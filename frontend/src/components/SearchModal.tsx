import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ExternalLink } from 'lucide-react';
import { Product } from '../types/product.types';

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, products }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredResults = query.trim()
    ? products.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.subcategory?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)) ||
          p.description?.toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex justify-center items-start pt-16 sm:pt-24 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Search Collection"
      data-testid="search-modal"
    >
      <div className="w-full max-w-2xl bg-white shadow-2xl border border-neutral-100 flex flex-col overflow-hidden max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-6 border-b border-neutral-100 flex items-center space-x-3">
          <Search className="w-5 h-5 text-neutral-400 stroke-[1.5] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dresses, jumpsuits, satin, linen..."
            className="flex-1 text-sm sm:text-base outline-none text-neutral-900 placeholder-neutral-400 font-light"
            data-testid="search-input"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-neutral-400 hover:text-neutral-900 p-1"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 ml-2"
            data-testid="close-search"
          >
            Close
          </button>
        </div>

        {/* Results / Suggestions Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6" data-testid="search-results">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-xs text-neutral-400 uppercase tracking-widest font-light">
              Type to search the collection
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-12 text-center" data-testid="search-no-results">
              <p className="text-xs uppercase tracking-widest text-neutral-400">
                No matching garments found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Try searching for &quot;dress&quot;, &quot;linen&quot;, or &quot;party&quot;.
              </p>
            </div>
          ) : (
            <div>
              <div className="text-[11px] uppercase tracking-widest text-neutral-400 mb-4">
                Found {filteredResults.length} {filteredResults.length === 1 ? 'garment' : 'garments'}
              </div>
              <ul className="divide-y divide-neutral-100">
                {filteredResults.map((product) => (
                  <li key={product.id} className="py-3 flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={product.images?.primary}
                        alt={product.title}
                        className="w-12 h-16 object-cover bg-neutral-100 flex-shrink-0"
                      />
                      <div className="truncate">
                        <h4 className="text-xs font-medium text-neutral-900 truncate uppercase tracking-wider">
                          {product.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-xs text-neutral-900">${product.price.toFixed(2)}</span>
                          <span className="text-[10px] uppercase text-neutral-400 tracking-wider">
                            {product.subcategory}
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={product.affiliate?.redirectPath || `/api/v1/redirect/${product.id}`}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      data-testid="search-affiliate-link"
                      className="flex-shrink-0 inline-flex items-center text-[11px] uppercase tracking-wider text-neutral-900 font-medium hover:underline ml-4"
                    >
                      VIEW <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
