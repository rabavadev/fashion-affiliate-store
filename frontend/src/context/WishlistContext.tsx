import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types/product.types';

export interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  count: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WISHLIST_STORAGE_KEY = 'mango_affiliate_wishlist';
export const LEGACY_STORAGE_KEY = 'fashion_store_wishlist_v1';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(WISHLIST_STORAGE_KEY) ||
                       window.localStorage.getItem(LEGACY_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      }
    } catch {
      // Fallback on storage read errors
    }
    return [];
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
      }
    } catch {
      // Handle storage write error
    }
  }, [wishlist]);

  // Cross-tab synchronization with strict non-array protection
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === WISHLIST_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setWishlist(parsed);
          }
        } catch {
          // Ignore corrupted storage events from external tabs
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const exists = safePrev.some((item) => item.id === product.id);
      if (exists) {
        return safePrev.filter((item) => item.id !== product.id);
      }
      return [...safePrev, product];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => (Array.isArray(prev) ? prev.filter((item) => item.id !== productId) : []));
  };

  const isInWishlist = (productId: string) => {
    return Array.isArray(wishlist) ? wishlist.some((item) => item.id === productId) : false;
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist: Array.isArray(wishlist) ? wishlist : [],
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        count: Array.isArray(wishlist) ? wishlist.length : 0,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export function useWishlist(): WishlistContextType {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
