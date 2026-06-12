'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type ViewMode = 'list' | 'card';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>('list');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read from localStorage on mount
    const stored = localStorage.getItem('stockflow-view-mode');
    if (stored === 'card' || stored === 'list') {
      setViewModeState(stored);
    }
    setMounted(true);
  }, []);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem('stockflow-view-mode', mode);
  };

  // Prevent hydration mismatch by not rendering or using a default until mounted
  // We just return children with the context provider.
  return (
    <ViewModeContext.Provider value={{ viewMode: mounted ? viewMode : 'list', setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
