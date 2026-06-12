'use client';

import React from 'react';
import { AlignJustify, LayoutGrid } from 'lucide-react';
import { useViewMode } from '@/context/ViewModeContext';

export function ViewToggle({ className = '' }: { className?: string }) {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <div className={`flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm ${className}`}>
      <button
        type="button"
        onClick={() => setViewMode('list')}
        aria-label="List View"
        className={`flex items-center justify-center rounded-md px-3 py-1.5 transition-all ${
          viewMode === 'list'
            ? 'theme-tab-active'
            : 'theme-tab-inactive text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
      >
        <AlignJustify className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setViewMode('card')}
        aria-label="Card View"
        className={`flex items-center justify-center rounded-md px-3 py-1.5 transition-all ${
          viewMode === 'card'
            ? 'theme-tab-active'
            : 'theme-tab-inactive text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
    </div>
  );
}
