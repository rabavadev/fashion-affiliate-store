import React from 'react';
import { Heart, Search } from 'lucide-react';

export interface HeaderProps {
  wishlistCount?: number;
  onOpenWishlist?: () => void;
  onOpenSearch?: () => void;
  activeNav?: string;
  onSelectNav?: (nav: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  wishlistCount = 0,
  onOpenWishlist,
  onOpenSearch,
  activeNav = 'COLLECTION',
  onSelectNav,
}) => {
  const navItems = ['NEW', 'COLLECTION', 'DRESSES', 'EDITORIAL'];

  return (
    <header className="sticky top-0 z-40 bg-[#FAFAFA]/95 backdrop-blur-md border-b border-[#E5E5E5]">
      {/* Top Banner / Announcement */}
      <div className="bg-[#111111] text-[#FAFAFA] text-[11px] uppercase tracking-[0.2em] text-center py-1.5 font-light">
        Editorial Collection — Free Shipping On In-Stock Garments
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Navigation Categories */}
          <nav className="hidden md:flex space-x-8 items-center" aria-label="Main Navigation">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => onSelectNav?.(item)}
                className={`text-xs uppercase tracking-[0.15em] transition-colors duration-200 ${
                  activeNav === item
                    ? 'font-medium text-[#111111] border-b border-[#111111] pb-0.5'
                    : 'text-[#767676] hover:text-[#111111]'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          {/* Center: Luxury Minimalist Typography Brand Logo */}
          <div className="flex-1 md:flex-initial text-center">
            <a
              href="/"
              className="font-serif text-3xl sm:text-4xl tracking-[0.25em] text-[#111111] uppercase font-light inline-block select-none"
              aria-label="MANGO Home"
            >
              MANGO
            </a>
          </div>

          {/* Right: Actions (Search, Wishlist) */}
          <div className="flex items-center space-x-6 justify-end">
            <button
              type="button"
              onClick={onOpenSearch}
              className="text-[#111111] hover:text-[#767676] p-2 transition-colors"
              aria-label="Search Collection"
              data-testid="search-toggle"
            >
              <Search className="w-5 h-5 stroke-[1.5]" />
            </button>

            <button
              type="button"
              onClick={onOpenWishlist}
              className="text-[#111111] hover:text-[#767676] p-2 transition-colors relative"
              aria-label="Wishlist"
              data-testid="wishlist-toggle"
            >
              <Heart className="w-5 h-5 stroke-[1.5]" />
              {wishlistCount > 0 && (
                <span
                  data-testid="wishlist-count"
                  className="absolute -top-1 -right-1 bg-[#111111] text-[#FAFAFA] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium"
                >
                  {wishlistCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
