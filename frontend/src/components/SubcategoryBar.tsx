import React from 'react';
import { SubcategoryOption } from '../types/product.types';

export const DEFAULT_SUBCATEGORIES: SubcategoryOption[] = [
  { key: 'all', label: 'ALL' },
  { key: 'dresses', label: 'DRESSES' },
  { key: 'jumpsuits', label: 'JUMPSUITS' },
  { key: 'party', label: 'PARTY' },
  { key: 'wedding-guest', label: 'WEDDING GUEST' },
  { key: 'office', label: 'OFFICE' },
  { key: 'long', label: 'LONG' },
  { key: 'midi', label: 'MIDI' },
  { key: 'short', label: 'SHORT' },
  { key: 'knitwear', label: 'KNITWEAR' },
];

export interface SubcategoryBarProps {
  subcategories?: SubcategoryOption[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export const SubcategoryBar: React.FC<SubcategoryBarProps> = ({
  subcategories = DEFAULT_SUBCATEGORIES,
  activeKey,
  onSelect,
}) => {
  return (
    <nav
      className="border-b border-[#E5E5E5] bg-[#FAFAFA]"
      aria-label="Subcategory Filters"
      data-testid="subcategory-bar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto py-3 no-scrollbar scroll-smooth">
          {subcategories.map((sub) => {
            const isActive = activeKey.toLowerCase() === sub.key.toLowerCase();
            return (
              <button
                key={sub.key}
                type="button"
                onClick={() => onSelect(sub.key)}
                data-testid={`filter-${sub.key}`}
                className={`text-xs uppercase tracking-[0.12em] whitespace-nowrap pb-1 transition-all duration-200 ${
                  isActive
                    ? 'active font-semibold text-[#111111] border-b-2 border-[#111111]'
                    : 'text-[#767676] hover:text-[#111111] border-b-2 border-transparent'
                }`}
              >
                {sub.label}
                {sub.count !== undefined && sub.count > 0 && (
                  <span className="ml-1 text-[10px] text-[#767676] font-normal">
                    ({sub.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default SubcategoryBar;
