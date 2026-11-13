import React, { createContext, useContext, useState, useEffect } from 'react';
import { GridViewMode } from '../types/product.types';

export const VIEW_STORAGE_KEY = 'mango_affiliate_grid_view';

export interface ViewContextType {
  columns: GridViewMode;
  effectiveColumns: GridViewMode;
  setColumns: (cols: GridViewMode) => void;
  isMobile: boolean;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider: React.FC<{ children: React.ReactNode; defaultColumns?: GridViewMode }> = ({
  children,
  defaultColumns = 4,
}) => {
  const [columns, setColumnsState] = useState<GridViewMode>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (parsed >= 1 && parsed <= 4) return parsed as GridViewMode;
        }
      }
    } catch {
      // Fallback on storage errors
    }
    return defaultColumns;
  });

  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const mediaQuery = window.matchMedia('(max-width: 640px)');
      const updateMobile = (e: MediaQueryListEvent | MediaQueryList) => {
        setIsMobile(e.matches);
      };

      updateMobile(mediaQuery);

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', updateMobile);
        return () => mediaQuery.removeEventListener('change', updateMobile);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(updateMobile);
        return () => mediaQuery.removeListener(updateMobile);
      }
    } catch {
      // In testing environments where matchMedia might be mocked or partial
    }
  }, []);

  const setColumns = (cols: GridViewMode) => {
    setColumnsState(cols);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(VIEW_STORAGE_KEY, String(cols));
      }
    } catch {
      // Ignore storage write errors
    }
  };

  const effectiveColumns: GridViewMode = isMobile ? (Math.min(columns, 2) as GridViewMode) : columns;

  return (
    <ViewContext.Provider value={{ columns, effectiveColumns, setColumns, isMobile }}>
      {children}
    </ViewContext.Provider>
  );
};

export function useView(): ViewContextType {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
}
