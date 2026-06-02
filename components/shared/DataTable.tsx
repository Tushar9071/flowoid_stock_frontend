'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Calendar,
} from 'lucide-react';
import { SkeletonTable } from '@/components/skeleton/Skeletons';
import { createPortal } from 'react-dom';

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type FilterType = 'text' | 'select' | 'number' | 'date' | 'boolean';

export interface ColumnDef<T> {
  field: keyof T | string;
  header: string;
  filterable?: boolean;
  filterType?: FilterType;
  filterOptions?: { label: string; value: string | number }[]; // For select type
  sortable?: boolean;
  getValue?: (row: T) => any;
  render?: (row: T) => React.ReactNode;
}

export interface AdvancedDataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  
  // Search
  searchable?: boolean;
  searchPlaceholder?: string;
  
  // Custom Empty State
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptySubtitle?: string;
  
  // States
  loading?: boolean;
  
  // Optional Controlled Callbacks (if parent wants to handle sorting/pagination from API)
  // If not provided, the table does client-side pagination, sorting, and filtering
  onRowClick?: (row: T) => void;
  className?: string;
}

// ─── COMPONENT ─────────────────────────────────────────────────────────────────
export function AdvancedDataTable<T extends Record<string, any>>({
  columns,
  data,
  searchable = true,
  searchPlaceholder = 'Search...',
  emptyIcon,
  emptyTitle = 'No records found',
  emptySubtitle = 'Try adjusting your filters or search query.',
  loading = false,
  onRowClick,
  className = '',
}: AdvancedDataTableProps<T>) {
  
  // -- Internal State for Client-Side Operations --
  const [globalSearch, setGlobalSearch] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  // Filters: Record of column field -> filter value(s)
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({});
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // -- Handlers --
  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc');
      else setSortField(null); // Reset sort
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      if (value === undefined || value === null || (Array.isArray(value) && value.length === 0) || value === '') {
        delete next[field];
      } else {
        next[field] = value;
      }
      return next;
    });
    setPage(1); // Reset page on filter
  };

  // -- Client-Side Processing Pipeline --
  const processedData = useMemo(() => {
    let result = [...data];

    // 1. Global Search
    if (searchable && globalSearch) {
      const lowerSearch = globalSearch.toLowerCase();
      result = result.filter(row => {
        // Search across all columns that are strings or numbers
        return columns.some(col => {
          const val = col.getValue ? col.getValue(row) : row[col.field as string];
          if (typeof val === 'string' || typeof val === 'number') {
            return String(val).toLowerCase().includes(lowerSearch);
          }
          return false;
        });
      });
    }

    // 2. Column Filters
    Object.entries(columnFilters).forEach(([field, filterValue]) => {
      const col = columns.find(c => c.field === field);
      if (!col) return;

      result = result.filter(row => {
        const val = col.getValue ? col.getValue(row) : row[field];
        
        switch (col.filterType) {
          case 'select':
            // filterValue is an array of selected values
            if (Array.isArray(filterValue) && filterValue.length > 0) {
              return filterValue.includes(val);
            }
            return true;
          case 'text':
            return String(val).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'boolean':
            return Boolean(val) === filterValue;
          case 'number':
            // Expect filterValue to be { min?: number, max?: number }
            if (filterValue.min !== undefined && val < filterValue.min) return false;
            if (filterValue.max !== undefined && val > filterValue.max) return false;
            return true;
          case 'date':
             // Expect filterValue to be { start?: string, end?: string }
            if (filterValue.start && new Date(val) < new Date(filterValue.start)) return false;
            if (filterValue.end && new Date(val) > new Date(filterValue.end)) return false;
            return true;
          default:
            return true;
        }
      });
    });

    // 3. Sorting
    if (sortField) {
      const sortCol = columns.find(c => c.field === sortField);
      result.sort((a, b) => {
        const aVal = sortCol?.getValue ? sortCol.getValue(a) : a[sortField];
        const bVal = sortCol?.getValue ? sortCol.getValue(b) : b[sortField];
        
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return sortDir === 'asc' ? 1 : -1;
        if (bVal === null || bVal === undefined) return sortDir === 'asc' ? -1 : 1;

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        
        return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });
    }

    return result;
  }, [data, columns, globalSearch, columnFilters, sortField, sortDir, searchable]);

  // -- Pagination --
  const totalItems = processedData.length;
  const totalPages = Math.ceil(totalItems / limit);
  const paginatedData = processedData.slice((page - 1) * limit, page * limit);

  const isEmpty = !loading && paginatedData.length === 0;

  return (
    <div className={`theme-surface-card flex flex-col ${className}`}>
      
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-slate-100">
        {searchable && (
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={globalSearch}
              onChange={e => {
                setGlobalSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]/20 focus:border-[#0F2A4A] transition-all"
            />
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-slate-500">
           {Object.keys(columnFilters).length > 0 && (
             <button
               onClick={() => setColumnFilters({})}
               className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded hover:bg-rose-100 transition-colors"
             >
               Clear Filters
             </button>
           )}
           <span>{totalItems} results</span>
        </div>
      </div>

      {/* Table Area */}
      {loading ? (
        <div className="p-4">
          <SkeletonTable rows={limit} cols={columns.length} />
        </div>
      ) : isEmpty ? (
        <div className="p-12 text-center">
          {emptyIcon && (
            <div className="theme-icon-chip mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
              {emptyIcon}
            </div>
          )}
          <p className="text-lg font-bold theme-text-primary">{emptyTitle}</p>
          <p className="mt-1 text-sm text-slate-500">{emptySubtitle}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="theme-table-header">
              <tr>
                {columns.map((col, i) => (
                  <th
                    key={col.field as string}
                    className="px-4 py-3 font-bold group"
                  >
                    <div className="flex items-center gap-1.5">
                      {/* Sortable Header Text */}
                      <div 
                        className={`flex items-center gap-1 ${col.sortable ? 'cursor-pointer select-none hover:text-[#0F2A4A]' : ''}`}
                        onClick={() => col.sortable && handleSort(col.field as string)}
                      >
                        {col.header}
                        {col.sortable && (
                          <span className="text-slate-400">
                            {sortField === col.field ? (
                              sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </span>
                        )}
                      </div>
                      
                      {/* Filter Icon Popover */}
                      {col.filterable && (
                        <HeaderFilter
                          column={col}
                          value={columnFilters[col.field as string]}
                          onChange={(val) => handleFilterChange(col.field as string, val)}
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((row, rIdx) => (
                <tr 
                  key={rIdx} 
                  className={`transition-colors hover:bg-slate-50/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col, cIdx) => (
                    <td key={col.field as string} className="px-4 py-3 text-slate-700">
                      {col.render ? col.render(row) : row[col.field as string]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && totalItems > 0 && (
        <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-slate-500">
              Page <span className="font-medium text-slate-700">{page}</span> of <span className="font-medium text-slate-700">{Math.max(totalPages, 1)}</span>
            </p>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Rows:</span>
              <select
                value={limit}
                onChange={e => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 cursor-pointer rounded-lg border border-slate-200 bg-white pl-2 pr-7 text-xs font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus:border-[#0F2A4A] focus:ring-1 focus:ring-[#0F2A4A]"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FILTER POPOVER COMPONENT ──────────────────────────────────────────────────
function HeaderFilter({ column, value, onChange }: { column: ColumnDef<any>; value: any; onChange: (val: any) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  
  // Local draft state for apply/clear semantics (so it doesn't filter on every keystroke unless desired)
  const [draft, setDraft] = useState<any>(value);
  
  const isActive = value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setDraft(value);
  }, [value, open]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        ref.current && 
        !ref.current.contains(e.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    
    function handleScroll(e: Event) {
      if (open) setOpen(false);
    }
    
    document.addEventListener('mousedown', handle);
    window.addEventListener('scroll', handleScroll, true); // capture phase to catch all scrolls
    window.addEventListener('resize', handleScroll);
    
    return () => {
      document.removeEventListener('mousedown', handle);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [open]);

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  const clear = () => {
    setDraft(undefined);
    onChange(undefined);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!open && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setCoords({
              top: rect.bottom + window.scrollY,
              left: rect.left + window.scrollX,
            });
          }
          setOpen(o => !o);
        }}
        className={`flex h-5 w-5 items-center justify-center rounded transition-colors ${
          isActive ? 'bg-[#0F2A4A] text-white' : 'text-slate-400 hover:bg-slate-200'
        }`}
      >
        <Filter className={`h-3 w-3 ${isActive ? 'fill-current' : ''}`} />
      </button>

      {open && mounted && createPortal(
        <div 
          ref={popoverRef}
          className="absolute z-[9999] mt-2 w-64 overflow-hidden rounded-xl bg-white text-slate-800 shadow-xl ring-1 ring-slate-200"
          style={{ top: coords.top, left: coords.left }}
          onClick={e => e.stopPropagation()} // Prevent sort trigger
        >
          <div className="p-3 font-normal max-h-64 overflow-y-auto">
            
            {/* TEXT FILTER */}
            {column.filterType === 'text' && (
              <input
                type="text"
                autoFocus
                placeholder={`Search ${column.header}...`}
                value={draft || ''}
                onChange={e => setDraft(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F2A4A]"
              />
            )}

            {/* SELECT FILTER */}
            {(column.filterType === 'select' && column.filterOptions) && (
              <div className="flex flex-col gap-1">
                {column.filterOptions.map(opt => {
                  const isChecked = Array.isArray(draft) ? draft.includes(opt.value) : false;
                  return (
                    <label key={opt.value} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50">
                      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isChecked ? 'border-[#0F2A4A] bg-[#0F2A4A]' : 'border-slate-300'}`}>
                        {isChecked && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isChecked}
                        onChange={() => {
                          const current = Array.isArray(draft) ? draft : [];
                          setDraft(isChecked ? current.filter(v => v !== opt.value) : [...current, opt.value]);
                        }}
                      />
                      <span className="text-[13px] font-medium tracking-wide">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
            
            {/* BOOLEAN FILTER */}
            {column.filterType === 'boolean' && (
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="bool" checked={draft === true} onChange={() => setDraft(true)} />
                  <span className="text-sm">Yes / Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="bool" checked={draft === false} onChange={() => setDraft(false)} />
                  <span className="text-sm">No / Inactive</span>
                </label>
              </div>
            )}
            
            {/* NUMBER RANGE */}
            {column.filterType === 'number' && (
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={draft?.min || ''}
                  onChange={e => setDraft({ ...draft, min: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F2A4A]"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={draft?.max || ''}
                  onChange={e => setDraft({ ...draft, max: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F2A4A]"
                />
              </div>
            )}

            {/* DATE RANGE */}
            {column.filterType === 'date' && (
              <div className="flex flex-col gap-2">
                <input
                  type="date"
                  value={draft?.start || ''}
                  onChange={e => setDraft({ ...draft, start: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F2A4A]"
                />
                <input
                  type="date"
                  value={draft?.end || ''}
                  onChange={e => setDraft({ ...draft, end: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F2A4A]"
                />
              </div>
            )}

          </div>
          
          <div className="flex gap-2 border-t border-slate-100 bg-slate-50 p-3">
            <button
              onClick={clear}
              className="flex-1 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
            >
              Clear
            </button>
            <button
              onClick={apply}
              className="flex-1 rounded-lg bg-[#0F2A4A] py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#1a3a5c]"
            >
              Apply
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
