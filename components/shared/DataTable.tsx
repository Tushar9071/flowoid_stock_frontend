"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { SkeletonTable } from "@/components/skeleton/Skeletons";
import { createPortal } from "react-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useViewMode } from "@/context/ViewModeContext";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { SearchInput } from "@/components/shared/search-input";
import { StatusToggle } from "@/components/shared/status-toggle";

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type FilterType = "text" | "select" | "number" | "date" | "boolean";

export interface ColumnDef<T> {
  field: keyof T | string;
  header: string;
  filterable?: boolean;
  filterType?: FilterType;
  filterOptions?: { label: string; value: string | number }[]; // For select type
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
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
  onStatusChange?: (id: string, newStatus: string) => Promise<void>;
  className?: string;
  hideViewToggle?: boolean;
}

// ─── COMPONENT ─────────────────────────────────────────────────────────────────
export function AdvancedDataTable<T extends Record<string, any>>({
  columns,
  data,
  searchable = true,
  searchPlaceholder = "Search...",
  emptyIcon,
  emptyTitle = "No records found",
  emptySubtitle = "Try adjusting your filters or search query.",
  loading = false,
  onRowClick,
  onStatusChange,
  className = "",
  hideViewToggle = false,
}: AdvancedDataTableProps<T>) {
  // -- Internal State for Client-Side Operations --
  const { viewMode } = useViewMode();
  const [globalSearch, setGlobalSearch] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Filters: Record of column field -> filter value(s)
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({});

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // -- Handlers --
  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDir === "asc") setSortDir("desc");
      else setSortField(null); // Reset sort
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (
        value === undefined ||
        value === null ||
        (Array.isArray(value) && value.length === 0) ||
        value === ""
      ) {
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
      result = result.filter((row) => {
        // Search across all columns that are strings or numbers
        return columns.some((col) => {
          const val = col.getValue
            ? col.getValue(row)
            : row[col.field as string];
          if (typeof val === "string" || typeof val === "number") {
            return String(val).toLowerCase().includes(lowerSearch);
          }
          return false;
        });
      });
    }

    // 2. Column Filters
    Object.entries(columnFilters).forEach(([field, filterValue]) => {
      const col = columns.find((c) => c.field === field);
      if (!col) return;

      result = result.filter((row) => {
        const val = col.getValue ? col.getValue(row) : row[field];

        switch (col.filterType) {
          case "select":
            // Support both array of selected values (multi-select) and single string (single-select)
            if (Array.isArray(filterValue)) {
              if (filterValue.length > 0) return filterValue.includes(val);
              return true;
            }
            if (filterValue !== undefined && filterValue !== null && filterValue !== "") {
              return String(val) === String(filterValue);
            }
            return true;
          case "text":
            return String(val)
              .toLowerCase()
              .includes(String(filterValue).toLowerCase());
          case "boolean":
            return Boolean(val) === filterValue;
          case "number":
            // Expect filterValue to be { min?: number, max?: number }
            if (filterValue.min !== undefined && val < filterValue.min)
              return false;
            if (filterValue.max !== undefined && val > filterValue.max)
              return false;
            return true;
          case "date":
            // Expect filterValue to be { start?: string, end?: string }
            if (
              filterValue.start &&
              new Date(val) < new Date(filterValue.start)
            )
              return false;
            if (filterValue.end && new Date(val) > new Date(filterValue.end))
              return false;
            return true;
          default:
            return true;
        }
      });
    });

    // 3. Sorting
    if (sortField) {
      const sortCol = columns.find((c) => c.field === sortField);
      result.sort((a, b) => {
        const aVal = sortCol?.getValue ? sortCol.getValue(a) : a[sortField];
        const bVal = sortCol?.getValue ? sortCol.getValue(b) : b[sortField];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined)
          return sortDir === "asc" ? 1 : -1;
        if (bVal === null || bVal === undefined)
          return sortDir === "asc" ? -1 : 1;

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDir === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        return sortDir === "asc"
          ? aVal > bVal
            ? 1
            : -1
          : aVal < bVal
            ? 1
            : -1;
      });
    }

    return result;
  }, [
    data,
    columns,
    globalSearch,
    columnFilters,
    sortField,
    sortDir,
    searchable,
  ]);

  // -- Pagination --
  const totalItems = processedData.length;
  const totalPages = Math.ceil(totalItems / limit);
  const paginatedData = processedData.slice((page - 1) * limit, page * limit);

  const isEmpty = !loading && paginatedData.length === 0;

  return (
    <div className={`theme-surface-card flex flex-col ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-slate-100">
        {/* Left Side */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {searchable ? (
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full !pl-[42px] !pr-4 !py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]/20 focus:border-[#0F2A4A] transition-all"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="font-medium">{totalItems} results</span>
              {Object.keys(columnFilters).length > 0 && (
                <button
                  onClick={() => setColumnFilters({})}
                  className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded hover:bg-rose-100 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3 text-sm text-slate-500 w-full sm:w-auto justify-end">
          {searchable && (
            <>
              {Object.keys(columnFilters).length > 0 && (
                <button
                  onClick={() => setColumnFilters({})}
                  className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded hover:bg-rose-100 transition-colors"
                >
                  Clear Filters
                </button>
              )}
              <span className="font-medium">{totalItems} results</span>
              {!hideViewToggle && <div className="h-6 w-px bg-slate-200"></div>}
            </>
          )}

          {!hideViewToggle && <ViewToggle />}
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
      ) : viewMode === "card" ? (
        <div className="p-4 bg-slate-50/30">
          {columns.some((c) => c.sortable || c.filterable) && (
            <div className="mb-4 flex justify-end">
              <div className="flex overflow-x-auto scrollbar-none gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm max-w-full">
                <span className="shrink-0 flex items-center px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Sort & Filter:
                </span>
                {columns
                  .filter((c) => c.sortable || c.filterable)
                  .map((col) => (
                    <div
                      key={col.field as string}
                      className="shrink-0 flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-sm border border-slate-100"
                    >
                      <span className="font-semibold text-slate-600">
                        {col.header}
                      </span>
                      {col.sortable && (
                        <button
                          onClick={() => handleSort(col.field as string)}
                          className={`ml-1 flex h-5 w-5 items-center justify-center rounded-md transition-colors ${sortField === col.field ? "bg-[#0F2A4A] text-white" : "hover:bg-slate-200 text-slate-400"}`}
                        >
                          {sortField === col.field ? (
                            sortDir === "asc" ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </button>
                      )}
                      {col.filterable && (
                        <div className="ml-1">
                          <HeaderFilter
                            column={col}
                            value={columnFilters[col.field as string]}
                            onChange={(val) =>
                              handleFilterChange(col.field as string, val)
                            }
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedData.map((row, rIdx) => (
              <div
                key={rIdx}
                onClick={() => onRowClick?.(row)}
                className={`theme-card-accent flex flex-col rounded-xl border border-slate-200 bg-white p-4 transition-all hover:shadow-md ${onRowClick ? "cursor-pointer hover:-translate-y-0.5" : ""}`}
              >
                {columns.map((col, cIdx) => (
                  <div
                    key={col.field as string}
                    className={
                      cIdx === 0
                        ? "mb-3 border-b border-slate-100 pb-3"
                        : "mt-2.5 flex items-start justify-between gap-3"
                    }
                  >
                    {cIdx === 0 ? (
                      <div className="text-base font-bold theme-text-primary">
                        {col.field === 'status' && onStatusChange && row.id !== undefined
                          ? <StatusToggle status={String(col.getValue ? col.getValue(row) : row[col.field as string])} id={String(row.id)} onStatusChange={onStatusChange} />
                          : col.render
                            ? col.render(row)
                            : col.getValue
                              ? col.getValue(row)
                              : row[col.field as string]}
                      </div>
                    ) : (
                      <>
                        <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                          {col.header}
                        </span>
                        <div className="text-sm font-medium text-slate-700 text-right overflow-hidden break-words">
                          {(col.field === 'status' || col.field === 'isActive') && onStatusChange && row.id !== undefined
                            ? <StatusToggle status={String(col.getValue ? col.getValue(row) : row[col.field as string])} id={String(row.id)} onStatusChange={onStatusChange} />
                            : col.render
                              ? col.render(row)
                              : col.getValue
                                ? col.getValue(row)
                                : row[col.field as string]}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
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
                    <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''}`}>
                      {/* Sortable Header Text */}
                      <div
                        className={`flex items-center gap-1 ${col.sortable ? "cursor-pointer select-none hover:text-[#0F2A4A]" : ""}`}
                        onClick={() =>
                          col.sortable && handleSort(col.field as string)
                        }
                      >
                        {col.header}
                        {col.sortable && (
                          <span className="text-slate-400">
                            {sortField === col.field ? (
                              sortDir === "asc" ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )
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
                          onChange={(val) =>
                            handleFilterChange(col.field as string, val)
                          }
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
                  className={`transition-colors hover:bg-slate-50/50 ${onRowClick ? "cursor-pointer" : ""}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={col.field as string}
                      className={`px-4 py-3 text-slate-700 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
                    >
                      {(col.field === 'status' || col.field === 'isActive') && onStatusChange && row.id !== undefined
                        ? <StatusToggle status={String(col.getValue ? col.getValue(row) : row[col.field as string])} id={String(row.id)} onStatusChange={onStatusChange} />
                        : col.render 
                          ? col.render(row) 
                          : col.getValue
                            ? col.getValue(row)
                            : row[col.field as string]}
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
              Page <span className="font-medium text-slate-700">{page}</span> of{" "}
              <span className="font-medium text-slate-700">
                {Math.max(totalPages, 1)}
              </span>
            </p>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Rows:</span>
              <Select
                value={String(limit)}
                onValueChange={(val: any) => {
                  setLimit(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[80px] h-[36px] bg-white border-slate-200 text-sm font-medium text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={String(pageSize)} className="font-medium cursor-pointer">
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
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
function HeaderFilter({
  column,
  value,
  onChange,
}: {
  column: ColumnDef<any>;
  value: any;
  onChange: (val: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  // Local draft state for apply/clear semantics (so it doesn't filter on every keystroke unless desired)
  const [draft, setDraft] = useState<any>(value);

  const isActive =
    value !== undefined &&
    value !== null &&
    value !== "" &&
    !(Array.isArray(value) && value.length === 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setDraft(value);
  }, [value, open]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      const target = e.target as HTMLElement;
      
      // Ignore clicks inside Radix UI portals (like the Select dropdown) so they don't close the parent popup
      if (
        target.closest('[role="listbox"]') || 
        target.closest('[data-radix-popper-content-wrapper]') || 
        target.closest('[data-slot="select-content"]')
      ) {
        return;
      }

      if (
        ref.current &&
        !ref.current.contains(target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleScroll(e: Event) {
      if (open) setOpen(false);
    }

    document.addEventListener("mousedown", handle);
    window.addEventListener("scroll", handleScroll, true); // capture phase to catch all scrolls
    window.addEventListener("resize", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handle);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
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
            const popoverWidth = 256; // w-64 is 256px
            let leftPos = rect.left + window.scrollX;
            if (rect.left + popoverWidth > window.innerWidth) {
              leftPos = rect.right + window.scrollX - popoverWidth;
              // Ensure it doesn't go off the left edge either
              if (leftPos < 0) leftPos = 16;
            }
            setCoords({
              top: rect.bottom + window.scrollY,
              left: leftPos,
            });
          }
          setOpen((o) => !o);
        }}
        className={`flex h-5 w-5 items-center justify-center rounded transition-colors ${
          isActive
            ? "bg-[#0F2A4A] text-white"
            : "text-slate-400 hover:bg-slate-200"
        }`}
      >
        <Filter className={`h-3 w-3 ${isActive ? "fill-current" : ""}`} />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            ref={popoverRef}
            className="absolute z-[9999] mt-2 w-64 overflow-hidden rounded-xl bg-white text-slate-800 shadow-xl ring-1 ring-slate-200"
            style={{ top: coords.top, left: coords.left }}
            onClick={(e) => e.stopPropagation()} // Prevent sort trigger
          >
            <div className="p-3 font-normal max-h-64 overflow-y-auto">
              {/* TEXT FILTER */}
              {(!column.filterType || column.filterType === "text") && (
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder={`Search ${column.header}...`}
                    value={draft || ""}
                    onChange={(e) => setDraft(e.target.value)}
                    className="w-full !pl-8 !pr-3 !py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F2A4A]"
                  />
                </div>
              )}

              {/* SELECT FILTER */}
              {column.filterType === "select" && column.filterOptions && (
                <div className="mb-2">
                  <Select
                    value={draft ? String(draft) : "all"}
                    onValueChange={(val: any) => {
                      const newValue = val === "all" ? "" : val;
                      setDraft(newValue);
                    }}
                  >
                    <SelectTrigger className="w-full bg-white border-slate-200 text-sm focus:ring-0 focus:ring-offset-0 focus:border-[#0F2A4A] h-[38px] rounded-lg font-medium text-slate-700">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all" className="font-medium cursor-pointer">All</SelectItem>
                      {column.filterOptions.map((opt, i) => (
                        <SelectItem key={i} value={String(opt.value)} className="font-medium cursor-pointer">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* BOOLEAN FILTER */}
              {column.filterType === "boolean" && (
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bool"
                      checked={draft === true}
                      onChange={() => setDraft(true)}
                    />
                    <span className="text-sm">Yes / Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bool"
                      checked={draft === false}
                      onChange={() => setDraft(false)}
                    />
                    <span className="text-sm">No / Inactive</span>
                  </label>
                </div>
              )}

              {/* NUMBER RANGE */}
              {column.filterType === "number" && (
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    value={draft?.min || ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        min: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F2A4A]"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={draft?.max || ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        max: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F2A4A]"
                  />
                </div>
              )}

              {/* DATE RANGE */}
              {column.filterType === "date" && (
                <div className="flex flex-col gap-2">
                  <input
                    type="date"
                    value={draft?.start || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, start: e.target.value })
                    }
                    className="w-full px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F2A4A]"
                  />
                  <input
                    type="date"
                    value={draft?.end || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, end: e.target.value })
                    }
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
          document.body,
        )}
    </div>
  );
}
