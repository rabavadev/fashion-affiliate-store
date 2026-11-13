import React from 'react';
import { GridViewMode } from '../types/product.types';

export interface GridViewSwitcherProps {
  columns: GridViewMode;
  onChange: (columns: GridViewMode) => void;
}

export const GridViewSwitcher: React.FC<GridViewSwitcherProps> = ({ columns, onChange }) => {
  const modes: GridViewMode[] = [1, 2, 3, 4];

  return (
    <div
      className="flex items-center space-x-2 text-xs uppercase tracking-widest text-neutral-500"
      data-testid="grid-view-switcher"
    >
      <span className="text-[11px] text-neutral-400 mr-1 hidden sm:inline">VIEW:</span>
      <div className="flex border border-neutral-200 rounded-none overflow-hidden">
        {modes.map((mode) => {
          const isActive = columns === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onChange(mode)}
              data-testid={`view-${mode}-btn`}
              aria-label={`Switch to ${mode} column grid`}
              className={`px-3 py-1 text-xs transition-colors duration-150 ${
                isActive
                  ? 'bg-neutral-900 text-white font-medium'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              {mode}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GridViewSwitcher;
