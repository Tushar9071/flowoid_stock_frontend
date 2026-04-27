'use client';

/**
 * ThemeSwitcher.tsx
 * ==================
 * A self-contained theme switcher dropdown component.
 *
 * Features:
 *  - Paint-palette icon trigger in the top nav (reflects current accent color)
 *  - Dropdown menu that appears below the icon
 *  - 5 theme options: Default + 4 curated palettes
 *  - Each option shows 4 color swatches and the theme name
 *  - Select: applies class to <body>, writes to localStorage, closes dropdown
 *  - Keyboard: Escape closes dropdown
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ThemeDefinition {
  id: string;        // body class name ('theme-ocean') or '' for default
  label: string;
  mood: string;
  isDefault?: boolean;
  swatches: [string, string, string, string]; // [sidebar, accent, light, chart]
  accentColor: string; // used for card hover border
}

// ─── Theme Registry ───────────────────────────────────────────────────────────

export const THEMES: ThemeDefinition[] = [
  {
    id: 'theme-default',
    label: 'Navy & Yellow',
    mood: 'Premium Default',
    isDefault: true,
    swatches: ['#0B1F3A', '#D4AF37', '#EAB308', '#2563EB'],
    accentColor: '#D4AF37',
  },
  {
    id: 'theme-emerald',
    label: 'Navy & Emerald',
    mood: 'Enterprise SaaS',
    swatches: ['#0B1120', '#10B981', '#10B981', '#3B82F6'],
    accentColor: '#10B981',
  },
  {
    id: 'theme-indigo',
    label: 'Indigo & Cyan',
    mood: 'Modern SaaS',
    swatches: ['#111827', '#4F46E5', '#4F46E5', '#06B6D4'],
    accentColor: '#4F46E5',
  },
  {
    id: 'theme-orange',
    label: 'Charcoal & Orange',
    mood: 'Professional ERP',
    swatches: ['#111827', '#F97316', '#F97316', '#2563EB'],
    accentColor: '#F97316',
  },
  {
    id: 'theme-teal',
    label: 'Teal & Purple',
    mood: 'Premium UI',
    swatches: ['#0F172A', '#14B8A6', '#8B5CF6', '#14B8A6'],
    accentColor: '#14B8A6',
  },
];

const VALID_THEME_IDS = [...THEMES.map((t) => t.id).filter(Boolean), 'theme-custom'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyTheme(themeId: string) {
  VALID_THEME_IDS.forEach((id) => document.body.classList.remove(id));
  if (themeId && themeId !== 'theme-default') {
    document.body.classList.add(themeId);
    localStorage.setItem('dashboard-theme', themeId);
  } else {
    localStorage.removeItem('dashboard-theme');
  }
}

function getActiveTheme(): string {
  if (typeof window === 'undefined') return 'theme-default';
  for (const id of VALID_THEME_IDS) {
    if (document.body.classList.contains(id)) return id;
  }
  return 'theme-default';
}

// ─── Swatch Strip ─────────────────────────────────────────────────────────────

function SwatchStrip({ swatches, label }: { swatches: [string, string, string, string]; label: string }) {
  return (
    <div className="flex gap-1">
      {swatches.map((color, i) => (
        <div
          key={i}
          title={`${label} swatch ${i + 1}: ${color}`}
          className="w-4 h-4 rounded-sm border border-black/10 shrink-0"
          style={{ background: color }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync active theme from body on mount
  useEffect(() => {
    setActiveTheme(getActiveTheme());
  }, []);

  // Keyboard: Escape closes dropdown
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // Click outside closes dropdown
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = useCallback((themeId: string) => {
    applyTheme(themeId);
    setActiveTheme(themeId);
    if (themeId !== 'theme-custom') {
      document.body.style.removeProperty('--color-custom-accent');
    }
    setIsOpen(false);
  }, []);

  const handleCustomColor = (color: string) => {
    applyTheme('theme-custom');
    setActiveTheme('theme-custom');
    document.body.style.setProperty('--color-custom-accent', color);
    localStorage.setItem('dashboard-custom-color', color);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Premium Palette Icon Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Appearance Settings"
        aria-label="Toggle theme menu"
        aria-expanded={isOpen}
        className={`group relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300 border ${
          isOpen 
            ? 'bg-white border-[#e2e8f0] shadow-sm ring-2 ring-[var(--color-accent)]/20' 
            : 'bg-white border-[#f1f5f9] hover:border-[#e2e8f0] hover:shadow-md hover:-translate-y-0.5'
        }`}
      >
        <div className="absolute inset-0 rounded-xl bg-[var(--color-accent)] opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" />
        
        <div className="relative flex items-center justify-center w-full h-full">
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`transition-all duration-300 ${isOpen ? 'scale-110 rotate-12' : 'group-hover:scale-105 group-hover:rotate-6'}`}
          >
          <defs>
            <linearGradient id="luxGradient" x1="4" y1="4" x2="20" y2="20">
              <stop offset="0%" stopColor="#6366F1"/>
              <stop offset="35%" stopColor="#06B6D4"/>
              <stop offset="70%" stopColor="#10B981"/>
              <stop offset="100%" stopColor="#EAB308"/>
            </linearGradient>
          </defs>

          {/* Luxury palette body */}
          <path d="M12 3C7.1 3 3 6.8 3 11.5C3 15.6 6.2 19 10.1 19H11.3
          C11.9 19 12.4 19.5 12.4 20.1
          C12.4 20.7 12.9 21.2 13.5 21.2
          C18.7 21.2 21 16.8 21 12.3
          C21 7.2 17.1 3 12 3Z"
          fill="url(#luxGradient)"
          stroke={isOpen ? "var(--color-accent)" : "#0F172A"}
          strokeWidth="1.4"/>

          {/* premium highlight dots */}
          <circle cx="8.4" cy="10.1" r="1.05" fill="white"/>
          <circle cx="11.6" cy="8.1" r="1.05" fill="white"/>
          <circle cx="15.3" cy="9" r="1.05" fill="white"/>

          {/* sparkle */}
          <path d="M18.5 4.4L18.9 5.5L20 5.9L18.9 6.3L18.5 7.4L18.1 6.3L17 5.9L18.1 5.5L18.5 4.4Z"
          fill="#ffffff"/>
        </svg>
        </div>

        {/* Elegant subtle glow when active */}
        {isOpen && (
          <div className="absolute -inset-1 rounded-[14px] bg-[var(--color-accent)]/10 animate-pulse" />
        )}
      </button>

      {/* ── Premium Dropdown Panel ── */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-[#e2e8f0] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="px-5 py-4 border-b border-[#f1f5f9] bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-bold text-[#1e293b]">Interface Theme</p>
                <p className="text-[12px] text-[#94a3b8] font-medium mt-0.5">Custom appearance for your workspace</p>
              </div>
            </div>
          </div>
          
          <div className="max-h-[420px] overflow-y-auto p-2.5 scrollbar-thin scrollbar-thumb-[#e2e8f0] scrollbar-track-transparent">
            <div className="px-3 py-2 mb-1">
              <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Curated Palettes</p>
            </div>
            
            {THEMES.map((theme) => {
              const isActive = activeTheme === theme.id;
              
              return (
                <button
                  key={theme.id || 'default'}
                  onClick={() => handleSelect(theme.id)}
                  className={`w-full group text-left p-3 mb-1 rounded-xl flex flex-col gap-2.5 transition-all duration-200 border ${
                    isActive 
                      ? 'bg-[#f8faff] border-[var(--color-accent)]/20 shadow-[0_4px_12px_rgba(0,0,0,0.03)]' 
                      : 'bg-white border-transparent hover:bg-[#f8fafc] hover:border-[#e2e8f0]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-2.5 h-2.5 rounded-full shadow-sm"
                        style={{ backgroundColor: theme.accentColor }}
                      />
                      <span className={`text-[13px] font-bold tracking-tight ${isActive ? 'text-[#1e293b]' : 'text-[#475569]'}`}>
                        {theme.label}
                      </span>
                      {theme.isDefault && (
                        <span className="text-[9px] font-bold text-[#64748b] bg-[#f1f5f9] border border-[#e2e8f0] rounded-full px-2 py-0.5 uppercase tracking-wider">
                          Official
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <div className="w-5 h-5 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white shadow-lg shadow-[var(--color-accent)]/20">
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="stroke-white">
                          <path d="M1 4L3.5 6.5L9 1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pl-5">
                    <SwatchStrip swatches={theme.swatches} label={theme.label} />
                    <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">{theme.mood}</span>
                  </div>
                </button>
              );
            })}

            {/* ── Premium Custom Color Picker Section ── */}
            <div className="h-px bg-[#f1f5f9] my-3 mx-2" />
            
            <div className="px-3 py-2">
              <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-3">Custom Branding</p>
              
              <div className={`p-4 rounded-2xl border transition-all duration-300 ${activeTheme === 'theme-custom' ? 'bg-[#f8faff] border-[var(--color-accent)]/20' : 'bg-white border-[#f1f5f9]'}`}>
                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    <input 
                      type="color" 
                      onChange={(e) => handleCustomColor(e.target.value)}
                      className="w-12 h-12 rounded-xl border-2 border-white shadow-md cursor-pointer bg-white transition-transform active:scale-95"
                      title="Pick custom brand color"
                    />
                    <div className="absolute inset-0 rounded-xl pointer-events-none ring-1 ring-black/5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-[#1e293b]">Live Brand Picker</p>
                    <p className="text-[11px] text-[#94a3b8] font-medium leading-relaxed">Instantly skin the entire dashboard to your brand</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-[#f1f5f9] bg-[#f8fafc]/50 text-center">
            <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em]">Flowoid Design System v2.0</p>
          </div>
        </div>
      )}
    </div>
  );
}
