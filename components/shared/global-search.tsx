'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Gem, Briefcase, User, X, FolderTree, Package, ShoppingCart, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { DesignService, WorkerService, InventoryService, OrderService } from '@/lib/services/business-modules.service';
import { PartyService } from '@/lib/services/party.service';
import { useAuth } from '@/lib/auth-context';

interface GlobalSearchProps {
  containerClassName?: string;
  placeholder?: string;
}

export function GlobalSearch({
  containerClassName,
  placeholder = 'Search designs, dealers, or workers globally...',
}: GlobalSearchProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [tenantId, setTenantId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    designs: any[];
    parties: any[];
    workers: any[];
    categories: any[];
    inventory: any[];
    orders: any[];
    dispatches: any[];
  }>({ designs: [], parties: [], workers: [], categories: [], inventory: [], orders: [], dispatches: [] });

  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch tenant
  useEffect(() => {
    if (user) {
      setTenantId("owner");
    }
  }, [user]);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim() || !tenantId) {
      setResults({ designs: [], parties: [], workers: [], categories: [], inventory: [], orders: [], dispatches: [] });
      setIsLoading(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const [designsRes, partiesRes, workersRes, categoriesRes, inventoryRes, ordersRes, dispatchesRes] = await Promise.all([
          DesignService.list(tenantId, { search: debouncedQuery, limit: 5 }),
          PartyService.list(tenantId, { search: debouncedQuery, limit: 5 }),
          WorkerService.list(tenantId, { search: debouncedQuery, limit: 5 }),
          DesignService.listCategories(tenantId, { search: debouncedQuery, limit: 5 }),
          InventoryService.listStock(tenantId, { search: debouncedQuery, limit: 5 }),
          OrderService.list(tenantId, { search: debouncedQuery, limit: 5 }),
          OrderService.listDispatches(tenantId, { search: debouncedQuery, limit: 5 }),
        ]);

        setResults({
          designs: designsRes?.success ? (designsRes as any).data?.items || [] : [],
          parties: partiesRes?.success ? (partiesRes as any).data?.items || [] : [],
          workers: workersRes?.success ? (workersRes as any).data?.items || [] : [],
          categories: categoriesRes?.success ? (categoriesRes as any).data?.items || [] : [],
          inventory: inventoryRes?.success ? (inventoryRes as any).data?.items || [] : [],
          orders: ordersRes?.success ? (ordersRes as any).data?.items || [] : [],
          dispatches: dispatchesRes?.success ? (dispatchesRes as any).data?.items || [] : [],
        });
      } catch (error) {
        console.error('Global search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery, tenantId]);

  const handleSelect = (type: 'design' | 'party' | 'worker' | 'category' | 'inventory' | 'order' | 'dispatch', item: any) => {
    setIsOpen(false);
    setQuery('');
    if (type === 'design') {
      router.push(`/dashboard/design-catalogue?search=${encodeURIComponent(item.code || item.name)}`);
    } else if (type === 'party') {
      const routePath = item.type === 'SUPPLIER' || item.partyType === 'SUPPLIER' ? 'suppliers' : 'dealers';
      router.push(`/dashboard/${routePath}?search=${encodeURIComponent(item.name || item.id)}`);
    } else if (type === 'worker') {
      router.push(`/dashboard/worker-management?search=${encodeURIComponent(item.name || item.id)}`);
    } else if (type === 'category') {
      router.push(`/dashboard/design-catalogue?category=${encodeURIComponent(item.id)}`);
    } else if (type === 'inventory') {
      router.push(`/dashboard/inventory-management?search=${encodeURIComponent(item.design?.code || item.design?.name || item.id)}`);
    } else if (type === 'order') {
      router.push(`/dashboard/orders-dispatch?search=${encodeURIComponent(item.orderNumber || item.id)}`);
    } else if (type === 'dispatch') {
      router.push(`/dashboard/orders-dispatch?search=${encodeURIComponent(item.challanNumber || item.id)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const hasResults =
    results.designs.length > 0 || 
    results.parties.length > 0 || 
    results.workers.length > 0 || 
    results.categories.length > 0 || 
    results.inventory.length > 0 || 
    results.orders.length > 0 || 
    results.dispatches.length > 0;
  const showDropdown = isOpen && (query.length > 0 || isLoading);

  return (
    <div ref={containerRef} className={cn('relative', containerClassName)}>
      <div className={cn('flex w-full items-center gap-2.5 rounded-full bg-slate-100 px-4 py-2.5 transition-all hover:bg-slate-200/60 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-200 focus-within:shadow-sm')}>
        <Search className="pointer-events-none h-4 w-4 shrink-0 text-[#9ca3af]" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm text-[#0F2A4A] outline-none placeholder:text-[#9ca3af]"
          placeholder={placeholder}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="p-0.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-xl max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#9ca3af]" />
            </div>
          ) : !hasResults && debouncedQuery ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              No results found for "{debouncedQuery}"
            </div>
          ) : (
            <div className="py-2">
              {results.designs.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-50/80">
                    Designs
                  </div>
                  {results.designs.map((design) => (
                    <button
                      key={design.id}
                      onClick={() => handleSelect('design', design)}
                      className="flex w-full items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3f4f6]">
                        <Gem className="h-4 w-4 text-[#6b7280]" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-semibold text-sm text-gray-900 truncate">
                          {design.name ? `${design.name} (${design.code || 'No Code'})` : (design.code || 'Unnamed Design')}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{design.category?.name || 'Uncategorized'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.parties.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-50/80">
                    Dealers & Parties
                  </div>
                  {results.parties.map((party) => (
                    <button
                      key={party.id}
                      onClick={() => handleSelect('party', party)}
                      className="flex w-full items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3f4f6]">
                        <Briefcase className="h-4 w-4 text-[#6b7280]" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-semibold text-sm text-gray-900 truncate">{party.name}</div>
                        <div className="text-xs text-gray-500 truncate">{party.phone || party.type || 'Party'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.workers.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-50/80">
                    Workers
                  </div>
                  {results.workers.map((worker) => (
                    <button
                      key={worker.id}
                      onClick={() => handleSelect('worker', worker)}
                      className="flex w-full items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3f4f6]">
                        <User className="h-4 w-4 text-[#6b7280]" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-semibold text-sm text-gray-900 truncate">{worker.name}</div>
                        <div className="text-xs text-gray-500 truncate">{worker.phone || worker.role || 'Worker'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.categories.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-50/80">
                    Categories
                  </div>
                  {results.categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleSelect('category', category)}
                      className="flex w-full items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3f4f6]">
                        <FolderTree className="h-4 w-4 text-[#6b7280]" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-semibold text-sm text-gray-900 truncate">{category.name}</div>
                        <div className="text-xs text-gray-500 truncate">Category</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.inventory.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-50/80">
                    Inventory
                  </div>
                  {results.inventory.map((item) => (
                    <button
                      key={item.id || item.designId}
                      onClick={() => handleSelect('inventory', item)}
                      className="flex w-full items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3f4f6]">
                        <Package className="h-4 w-4 text-[#6b7280]" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-semibold text-sm text-gray-900 truncate">
                          {item.design?.name ? `${item.design.name} (${item.design.code})` : item.design?.code || 'Unknown Design'}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          In Stock: {item.quantity || 0}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.orders.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-50/80">
                    Orders
                  </div>
                  {results.orders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => handleSelect('order', order)}
                      className="flex w-full items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3f4f6]">
                        <ShoppingCart className="h-4 w-4 text-[#6b7280]" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-semibold text-sm text-gray-900 truncate">
                          {order.orderNumber || 'Unknown Order'}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {order.party?.name || 'Unknown Party'} • {order.status || 'Pending'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.dispatches.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-50/80">
                    Dispatches
                  </div>
                  {results.dispatches.map((dispatch) => (
                    <button
                      key={dispatch.id}
                      onClick={() => handleSelect('dispatch', dispatch)}
                      className="flex w-full items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3f4f6]">
                        <Truck className="h-4 w-4 text-[#6b7280]" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-semibold text-sm text-gray-900 truncate">
                          {dispatch.challanNumber || 'Unknown Dispatch'}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          Order: {dispatch.order?.orderNumber || 'N/A'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
