'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  Plus, Grid2X2, List, Gem, Edit3, Trash2, Settings2,
  X, ArrowLeft, Eye, Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonCard, SkeletonTable } from '@/components/skeleton/Skeletons';
import { AdvancedDataTable, ColumnDef } from '@/components/shared/DataTable';
import { SimpleRecordModal, SimpleField } from '@/components/shared/simple-record-modal';
import { PremiumSelect } from '@/components/ui/PremiumSelect';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { SearchInput } from '@/components/shared/search-input';
import { formatCurrency } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';
import {
  BackendRecord,
  DesignService,
  responseItems,
  SupplementaryService,
} from '@/lib/services/business-modules.service';

import { useViewMode } from '@/context/ViewModeContext';
import { ViewToggle } from '@/components/ui/ViewToggle';

type ModalMode = 'design' | 'category' | 'need' | null;

function money(value: unknown) {
  return formatCurrency(Number(value || 0));
}

function resolveCategoryName(design: BackendRecord, categories: BackendRecord[]): string {
  if (design.category?.name) return design.category.name;
  if (design.categoryId) {
    const cat = categories.find(c => c.id === design.categoryId);
    if (cat?.name) return cat.name;
  }
  return 'Uncategorized';
}

function designCode(design: BackendRecord) {
  return design.code || '-';
}

function designStatus(design: BackendRecord) {
  return String(design.status || 'ACTIVE').toUpperCase();
}

function materialName(item: BackendRecord) {
  return item.rawMaterial?.name || item.name || 'Material';
}

/**
 * Converts any backend image path to a frontend-accessible URL via the Next.js proxy.
 * Backend stores paths like: /uploads/designs/xxx.jpg
 * The Next.js proxy at /uploads/[...path] forwards requests to the backend static file server.
 */
function backendAssetUrl(imagePath: string | undefined | null) {
  if (!imagePath) return '';
  // Already a full external URL — use as-is
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  // Normalize Windows backslashes to forward slashes
  let normalized = imagePath.replace(/\\/g, '/');
  // Strip any /api/ or api/ prefix so we always get /uploads/...
  normalized = normalized.replace(/^\/?api\//, '/');
  // Ensure a leading slash so it hits the Next.js route handler at /uploads/[...path]
  if (!normalized.startsWith('/')) normalized = '/' + normalized;
  return normalized;
}

function primaryDesignImage(design: BackendRecord) {
  const images = design.images || [];
  if (images.length === 0) {
    return backendAssetUrl(design.imageUrl || design.image);
  }
  const image = images.find((item: BackendRecord) => item.isPrimary) || images[0];
  return backendAssetUrl(image?.url || design.imageUrl || design.image);
}

// ─── Status Pill ─────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const active = status === 'ACTIVE';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-[#f3f4f6] text-[#6b7280]'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function DesignCataloguePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DesignCatalogueContent />
    </Suspense>
  );
}

function DesignCatalogueContent() {
  const { hasPermission } = useAuth();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { viewMode, setViewMode } = useViewMode();
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [designs, setDesigns] = useState<BackendRecord[]>([]);
  const [categories, setCategories] = useState<BackendRecord[]>([]);
  const [rawMaterials, setRawMaterials] = useState<BackendRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<any>(null);
  const [viewingDesign, setViewingDesign] = useState<BackendRecord | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingDesign, setEditingDesign] = useState<BackendRecord | null>(null);
  const [editingCategory, setEditingCategory] = useState<BackendRecord | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<BackendRecord | null>(null);
  const [editingNeed, setEditingNeed] = useState<BackendRecord | null>(null);
  const [designForm, setDesignForm] = useState<Record<string, any>>({});
  const [categoryForm, setCategoryForm] = useState<Record<string, any>>({});
  const [needForm, setNeedForm] = useState<Record<string, any>>({});
  const [needsByDesignId, setNeedsByDesignId] = useState<Record<string, BackendRecord[]>>({});
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Column filter state
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setPage(p => p + 1);
        }
      },
      { rootMargin: '200px' }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, []);

  const canCreate = hasPermission('designs.create');
  const canUpdate = hasPermission('designs.update');
  const canDelete = hasPermission('designs.delete');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [designRes, categoryRes, rawMaterialRes] = await Promise.all([
        DesignService.list('', { page: 1, limit: 100 }),
        DesignService.listCategories('', { page: 1, limit: 100 }),
        SupplementaryService.list('', { page: 1, limit: 100 }),
      ]);

      const loadedDesigns = designRes.success ? responseItems(designRes.data) : [];
      const loadedCategories = categoryRes.success ? responseItems(categoryRes.data) : [];

      if (designRes.success) setDesigns(loadedDesigns);
      else toast.error(designRes.error?.message || 'Failed to load designs');

      if (categoryRes.success) setCategories(loadedCategories);
      if (rawMaterialRes.success) setRawMaterials(responseItems(rawMaterialRes.data));

      if (loadedDesigns.length > 0) {
        const needEntries = await Promise.all(
          loadedDesigns
            .filter(design => design.id)
            .map(async design => {
              const response = await DesignService.listSupplementaryNeeds('', design.id);
              return [design.id, response.success ? responseItems(response.data as any) : []] as const;
            })
        );
        setNeedsByDesignId(Object.fromEntries(needEntries));
      }
    } catch {
      toast.error('Failed to load design catalogue');
    } finally {
      setLoading(false);
    }
  }, []);

  const pathname = usePathname();

  useEffect(() => {
    loadData();
  }, [loadData, pathname]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory, filterCategories, filterStatus]);

  // ─── Form Field Definitions ───────────────────────────────────────────────

  const designFields: SimpleField[] = [
    {
      name: 'categoryId',
      label: 'Category',
      type: 'select',
      required: true,
      options: categories.map(cat => ({ label: cat.name || 'Category', value: cat.id })),
    },
    { name: 'code', label: 'Design Code', required: true },
    { name: 'name', label: 'Design Name', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'sellingPrice', label: 'Selling Price (₹)', type: 'number', required: true },
    { name: 'productionCost', label: 'Production Cost (₹)', type: 'number' },
    { name: 'images', label: 'Design Images', type: 'file' },
  ];

  const categoryFields: SimpleField[] = [
    { name: 'name', label: 'Category Name', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
  ];

  const needFields: SimpleField[] = [
    {
      name: 'rawMaterialId',
      label: 'Raw Material',
      type: 'select',
      required: true,
      options: rawMaterials.map(item => {
        const avail = item.currentStock ?? item.stock?.quantityAvailable ?? 0;
        return {
          label: `${item.name || 'Material'} (${item.unit || 'unit'}) — ${Number(avail).toLocaleString()} avail`,
          value: item.id,
        };
      }),
    },
    { name: 'quantityRequired', label: 'Quantity Required', type: 'number', required: true },
    {
      name: 'unit',
      label: 'Unit Basis',
      type: 'select',
      required: true,
      options: [
        { label: 'Per Piece', value: 'PIECE' },
        { label: 'Per Dozen', value: 'DOZEN' },
      ],
    },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ];

  // ─── Form Handlers ────────────────────────────────────────────────────

  const openDesignForm = (design?: BackendRecord) => {
    setEditingDesign(design || null);
    setModalMode('design');
    setDesignForm(
      design
        ? {
            categoryId: design.categoryId || design.category?.id || '',
            code: design.code || '',
            name: design.name || '',
            description: design.description || '',
            sellingPrice: design.sellingPrice || 0,
            productionCost: design.productionCost || 0,
          }
        : {
            categoryId: categories[0]?.id || '',
            code: `DES-${Date.now().toString().slice(-5)}`,
            name: '',
            description: '',
            sellingPrice: 0,
            productionCost: 0,
          }
    );
  };

  const openCategoryForm = (category?: BackendRecord) => {
    setEditingCategory(category || null);
    setModalMode('category');
    setCategoryForm(
      category
        ? { name: category.name || '', description: category.description || '' }
        : { name: '', description: '' }
    );
  };

  const openNeedForm = (design: BackendRecord, need?: BackendRecord) => {
    setSelectedDesign(design);
    setEditingNeed(need || null);
    setModalMode('need');
    
    const initialRawMaterialId = need
      ? (need.rawMaterialId || need.rawMaterial?.id || '')
      : (rawMaterials[0]?.id || '');
      
    const rawUnit = rawMaterials.find(m => m.id === initialRawMaterialId)?.unit;
    const initialUnit = need
      ? (need.unit === 'DOZEN' ? 'DOZEN' : 'PIECE')
      : (rawUnit === 'DOZEN' ? 'DOZEN' : 'PIECE');

    setNeedForm({
      rawMaterialId: initialRawMaterialId,
      quantityRequired: need?.quantityRequired || '',
      unit: initialUnit,
      notes: need?.notes || '',
    });
  };

  const closeModal = () => {
    setModalMode(null);
    setFormError(null);
    setEditingDesign(null);
    setEditingCategory(null);
    setSelectedDesign(null);
    setEditingNeed(null);
    setDesignForm({});
    setCategoryForm({});
    setNeedForm({});
  };

  // ─── Save / Delete Handlers ────────────────────────────────────────────────

  const saveDesign = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const files = Array.isArray(designForm.images)
        ? designForm.images.filter((file: unknown) => file instanceof File)
        : [];
      const payload = {
        categoryId: designForm.categoryId,
        name: designForm.name,
        sellingPrice: Number(designForm.sellingPrice || 0),
        productionCost: Number(designForm.productionCost || 0),
        description: designForm.description || undefined,
        ...(editingDesign?.id ? {} : { code: designForm.code }),
      };

      let response;
      if (editingDesign?.id) {
        response = await DesignService.update('', editingDesign.id, payload);
        if (response.success && files.length) {
          const imageData = new FormData();
          imageData.append('altText', String(designForm.name || 'Design image'));
          imageData.append('isPrimary', 'true'); // mark first image as primary so it shows in list
          files.forEach((file: File) => imageData.append('images', file));
          const imageResponse = await DesignService.uploadImages('', editingDesign.id, imageData);
          if (!imageResponse.success)
            throw new Error(imageResponse.error?.message || 'Design saved, but image upload failed');
        }
      } else if (files.length) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') formData.append(key, String(value));
        });
        formData.append('altText', String(designForm.name || 'Design image'));
        formData.append('isPrimary', 'true'); // mark first image as primary so it shows in list
        files.forEach((file: File) => formData.append('images', file));
        response = await DesignService.create('', formData);
      } else {
        response = await DesignService.create('', payload);
      }

      if (!response.success) {
        setFormError(response.error);
        return;
      }
      toast.success(editingDesign ? 'Design updated' : 'Design created');
      closeModal();
      await loadData();
    } catch (error: any) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const saveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: categoryForm.name,
        description: categoryForm.description || undefined,
      };

      const response = editingCategory?.id
        ? await DesignService.updateCategory('', editingCategory.id, payload)
        : await DesignService.createCategory('', payload);

      if (!response.success) {
        setFormError(response.error);
        return;
      }
      toast.success(editingCategory ? 'Category updated' : 'Category created');
      closeModal();
      await loadData();
    } catch (error: any) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (category: BackendRecord) => {
    if (!category.id) return toast.error('Category not found');

    setConfirmConfig({
      isOpen: true,
      title: 'Deactivate Category',
      message: `Deactivate category "${category.name || 'this category'}"?`,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        const response = await DesignService.deleteCategory('', category.id as string);
        if (response.success) {
          toast.success('Category deactivated');
          if (selectedCategory === category.id) setSelectedCategory(null);
          await loadData();
        } else {
          toast.error(response.error?.message || 'Failed to deactivate category');
        }
      },
    });
  };

  const saveNeed = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedDesign?.id) return toast.error('Design not found');

    // Frontend duplicate check for raw material within this specific design
    if (!editingNeed?.id) {
      const existingNeeds = needsByDesignId[selectedDesign.id] || [];
      const isDuplicate = existingNeeds.some((n: any) => n.rawMaterialId === needForm.rawMaterialId);
      if (isDuplicate) {
        const matchedMat = rawMaterials.find(m => m.id === needForm.rawMaterialId);
        const materialName = matchedMat?.name || 'This raw material';
        setFormError({
          message: `${materialName} is already configured as a supplementary material for this design.`,
        });
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        rawMaterialId: needForm.rawMaterialId,
        quantityRequired: Number(needForm.quantityRequired || 0),
        unit: needForm.unit || 'PIECE',
        notes: needForm.notes || undefined,
      };

      const response = editingNeed?.id
        ? await DesignService.updateSupplementaryNeed('', selectedDesign.id, editingNeed.id, {
            quantityRequired: payload.quantityRequired,
            unit: payload.unit,
            notes: payload.notes,
          })
        : await DesignService.addSupplementaryNeed('', selectedDesign.id, payload);

      if (!response.success) {
        setFormError(response.error);
        return;
      }
      toast.success(editingNeed ? 'Supplementary need updated' : 'Supplementary need added');
      closeModal();
      await loadData();
    } catch (error: any) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const deleteNeed = async (design: BackendRecord, need: BackendRecord) => {
    if (!design.id || !need.id) return toast.error('Design or need not found');

    setConfirmConfig({
      isOpen: true,
      title: 'Remove Supplementary Need',
      message: 'Remove this supplementary need?',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        const response = await DesignService.deleteSupplementaryNeed(
          '',
          design.id as string,
          need.id as string
        );
        if (response.success) {
          toast.success('Supplementary need removed');
          await loadData();
        } else {
          toast.error(response.error?.message || 'Failed to remove supplementary need');
        }
      },
    });
  };

  const deleteDesign = async (design: BackendRecord) => {
    if (!design.id) return toast.error('Design not found');

    setConfirmConfig({
      isOpen: true,
      title: 'Delete Design',
      message: `Delete "${design.name || designCode(design)}"? (Soft Delete)`,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        const response = await DesignService.delete('', design.id as string);
        if (response.success) {
          toast.success('Design deleted');
          await loadData();
        } else {
          toast.error(response.error?.message || 'Failed to delete design');
        }
      },
    });
  };

  const markDesignInactive = async (design: BackendRecord) => {
    if (!design.id) return toast.error('Design not found');

    setConfirmConfig({
      isOpen: true,
      title: 'Deactivate Design',
      message: `Mark "${design.name || designCode(design)}" as inactive?`,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        const response = await DesignService.updateStatus('', design.id as string, { status: 'INACTIVE' });
        if (response.success) {
          toast.success('Design deactivated');
          await loadData();
        } else {
          toast.error(response.error?.message || 'Failed to deactivate design');
        }
      },
    });
  };

  // Fetch full design (with ALL images) before showing the details view
  const viewDesign = async (design: BackendRecord) => {
    const res = await DesignService.getById('', design.id as string);
    if (res.success && res.data) {
      const full = (res.data as any).design || res.data;
      setViewingDesign(full as BackendRecord);
    } else {
      // Fall back to the list data if fetch fails
      setViewingDesign(design);
    }
  };

  // ─── Filtering & Pagination ───────────────────────────────────────────────

  const filteredDesigns = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return designs.filter(design => {
      const matchesSearch =
        String(design.name || '').toLowerCase().includes(term) ||
        String(designCode(design)).toLowerCase().includes(term);

      const matchesCategory =
        !selectedCategory ||
        design.categoryId === selectedCategory ||
        design.category?.id === selectedCategory;

      const matchesFilterCategory =
        filterCategories.length === 0 ||
        filterCategories.includes(design.categoryId as string);

      const matchesFilterStatus =
        filterStatus.length === 0 || filterStatus.includes(designStatus(design));

      return matchesSearch && matchesCategory && matchesFilterCategory && matchesFilterStatus;
    });
  }, [designs, searchTerm, selectedCategory, filterCategories, filterStatus]);

  const paginatedDesigns = useMemo(
    () => filteredDesigns.slice(0, page * itemsPerPage),
    [filteredDesigns, page, itemsPerPage]
  );

  const activeFilters = filterCategories.length + filterStatus.length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <DashboardLayout
      title={viewingDesign ? 'Design Details' : 'Design Catalogue'}
      subtitle={
        viewingDesign
          ? `Viewing details for ${viewingDesign.name || designCode(viewingDesign)}`
          : 'Manage designs, categories, and supplementary material requirements'
      }
      action={
        !viewingDesign ? (
          <div className="flex flex-wrap gap-2">
            {canCreate && (
              <button
                onClick={() => openDesignForm()}
                className="inline-flex items-center gap-2 rounded-lg theme-accent-btn px-5 py-2.5 text-sm font-semibold transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Design
              </button>
            )}
          </div>
        ) : undefined
      }
    >
      {viewingDesign ? (
        <DesignDetails
          design={viewingDesign}
          categories={categories}
          needs={needsByDesignId[viewingDesign.id as string] || []}
          rawMaterials={rawMaterials}
          onBack={() => setViewingDesign(null)}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEditDesign={openDesignForm}
          onDeleteDesign={d => {
            deleteDesign(d);
            setViewingDesign(null);
          }}
          onAddNeed={openNeedForm}
          onEditNeed={openNeedForm}
          onDeleteNeed={deleteNeed}
          onMarkInactive={markDesignInactive}
        />
      ) : (
        <div className="space-y-6">
          {/* Sticky Filters Container */}
          <div className="sticky top-0 z-10 -mt-4 sm:-mt-6 pt-4 sm:pt-6 pb-6 -mx-4 sm:-mx-6 px-4 sm:px-6 bg-[#f0f2f5]/95 backdrop-blur-md">
            <div className="flex flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-sm">
              {/* Search & View Toggle */}
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div className="flex w-full flex-1 gap-2 sm:w-auto">
                  <SearchInput
                    containerClassName="flex-1 sm:flex-none sm:w-[320px]"
                    placeholder="Search by name, code..."
                    value={searchTerm}
                    onChange={event => setSearchTerm(event.target.value)}
                  />
                  {activeFilters > 0 && (
                    <button
                      onClick={() => {
                        setFilterCategories([]);
                        setFilterStatus([]);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[12px] font-semibold text-[#6b7280] hover:bg-[#f3f4f6]"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
                <ViewToggle />
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-1.5 flex-wrap pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-[13px] font-medium ${!selectedCategory ? 'theme-tab-active' : 'border-[#e5e7eb] bg-white text-[#6b7280]'}`}
                >
                  All ({designs.length})
                </button>
                {categories.map(category => {
                  const key = category.id as string;
                  const label = category.name || 'Category';
                  const count = designs.filter(d => d.categoryId === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-[13px] font-medium ${selectedCategory === key ? 'theme-tab-active' : 'border-[#e5e7eb] bg-white text-[#6b7280]'}`}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card View */}
          {!loading && viewMode === 'card' && (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {paginatedDesigns.map(design => (
                  <div key={design.id} className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white theme-card-accent">
                    {/* Card Image */}
                    <div className="relative flex h-40 items-center justify-center overflow-hidden border-b border-[#e5e7eb] bg-[#f0f2f5]">
                      {primaryDesignImage(design) ? (
                        <>
                          <img
                            src={primaryDesignImage(design)}
                            alt={design.name || 'Design'}
                            className="h-full w-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          {(design.images?.length || 0) > 1 && (
                            <div className="absolute top-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
                              {design.images.length} Images
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center">
                          <Gem className="mx-auto mb-2 h-8 w-8 text-[#9ca3af]" />
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
                            {resolveCategoryName(design, categories)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <div className="mb-1.5 flex flex-wrap gap-1.5">
                            <span className="inline-block rounded bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-semibold text-[#6b7280]">
                              {designCode(design)}
                            </span>
                            <span className="inline-block rounded bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-semibold text-[#6b7280]">
                              {resolveCategoryName(design, categories)}
                            </span>
                          </div>
                          <h3 className="text-[16px] font-bold leading-tight theme-text-primary">
                            {design.name || 'Unnamed Design'}
                          </h3>
                          {design.description && (
                            <p className="mt-1 text-[12px] text-[#6b7280] line-clamp-2">{design.description}</p>
                          )}
                        </div>
                        <StatusPill status={designStatus(design)} />
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-lg bg-slate-50 p-2 text-center border border-slate-100">
                          <span className="block text-[10px] font-semibold uppercase text-slate-500">Selling Price</span>
                          <span className="font-bold text-slate-900">{money(design.sellingPrice)}</span>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2 text-center border border-slate-100">
                          <span className="block text-[10px] font-semibold uppercase text-slate-500">Prod. Cost</span>
                          <span className="font-bold text-slate-900">{money(design.productionCost)}</span>
                        </div>
                      </div>

                      {/* Supplementary Materials */}
                      {(() => {
                        const needs = needsByDesignId[design.id as string] || [];
                        return (
                          <div className="mt-4 border-t border-slate-100 pt-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Supplementary
                                {needs.length > 0 && (
                                  <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                                    {needs.length}
                                  </span>
                                )}
                              </span>
                              {canUpdate && (
                                <button
                                  onClick={() => openNeedForm(design)}
                                  className="text-[10px] font-bold text-blue-500 hover:text-blue-700 transition-colors"
                                  title="Add supplementary need"
                                >
                                  + Add
                                </button>
                              )}
                            </div>
                            {needs.length === 0 ? (
                              <p className="text-[11px] italic text-slate-300">No materials added.</p>
                            ) : (
                              <div className="space-y-1">
                                {needs.slice(0, 3).map(need => {
                                  const material = rawMaterials.find(rm => rm.id === need.rawMaterialId);
                                  return (
                                    <div
                                      key={need.id as string}
                                      className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1.5 text-xs"
                                    >
                                      <span className="font-medium text-slate-600 truncate mr-2">
                                        {material?.name || need.rawMaterial?.name || 'Material'}
                                      </span>
                                      <span className="shrink-0 rounded bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                                        {need.quantityRequired} {need.unit}
                                      </span>
                                    </div>
                                  );
                                })}
                                {needs.length > 3 && (
                                  <p className="text-center text-[10px] font-semibold text-slate-400 pt-0.5">
                                    +{needs.length - 3} more
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#f3f4f6] pt-4">
                        <button
                          onClick={() => viewDesign(design)}
                          className="theme-secondary-btn rounded-lg p-2"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openNeedForm(design)}
                          className="theme-secondary-btn rounded-lg p-2"
                          title="Supplementary materials"
                        >
                          <Settings2 className="h-4 w-4" />
                        </button>
                        {canUpdate && (
                          <button
                            onClick={() => openDesignForm(design)}
                            className="theme-secondary-btn rounded-lg p-2"
                            title="Edit design"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <>
                            <button
                              onClick={() => markDesignInactive(design)}
                              className="theme-secondary-btn rounded-lg p-2"
                              title="Mark Inactive"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                            </button>
                            <button
                              onClick={() => deleteDesign(design)}
                              className="theme-danger-btn rounded-lg p-2"
                              title="Delete design"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {page * itemsPerPage < filteredDesigns.length && (
                <div ref={observerTarget} className="h-10 w-full" />
              )}
              {filteredDesigns.length === 0 && (
                <div className="rounded-xl border border-[#e5e7eb] bg-white p-12 text-center">
                  <div className="theme-icon-chip mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
                    <Gem className="h-6 w-6" />
                  </div>
                  <p className="text-lg font-bold theme-text-primary">No designs found</p>
                  <p className="mt-1 text-sm text-[#6b7280]">Try adjusting search or filters.</p>
                </div>
              )}
            </>
          )}

          {/* List View with DataTable */}
          {viewMode === 'list' && (
            <AdvancedDataTable
              data={filteredDesigns}
              searchable={false}
              hideViewToggle={true}
              loading={loading}
              emptyIcon={<Gem className="h-6 w-6 text-slate-400" />}
              emptyTitle="No designs found"
              emptySubtitle="Try adjusting search or filters."
              onStatusChange={async (id, newStatus) => {
                const response = await DesignService.updateStatus('', id, { status: newStatus });
                if (!response.success) {
                  throw new Error(response.error?.message || 'Failed to update status');
                }
                // Reload data gently in the background without a full loading spinner if possible
                loadData();
              }}
              columns={[
                {
                  field: 'code',
                  header: 'Code',
                  sortable: true,
                  filterable: true,
                  filterType: 'text',
                  render: row => (
                    <div className="flex items-center gap-3">
                      <div className="theme-icon-chip flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                        {primaryDesignImage(row) ? (
                          <img
                            src={primaryDesignImage(row)}
                            alt="Design"
                            className="h-full w-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <Gem className="h-4 w-4" />
                        )}
                      </div>
                      {designCode(row)}
                    </div>
                  ),
                },
                {
                  field: 'name',
                  header: 'Name',
                  sortable: true,
                  filterable: true,
                  filterType: 'text',
                  render: row => (
                    <div>
                      <div className="font-bold text-[#374151]">{row.name || '-'}</div>
                      {row.description && (
                        <p className="mt-0.5 text-xs font-normal text-slate-500 max-w-xs truncate">
                          {row.description}
                        </p>
                      )}
                    </div>
                  ),
                },
                {
                  field: 'category',
                  header: 'Category',
                  sortable: true,
                  filterable: true,
                  filterType: 'select',
                  filterOptions: categories.map(c => ({ label: String(c.name), value: String(c.name) })),
                  getValue: row => resolveCategoryName(row, categories),
                  render: row => (
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {resolveCategoryName(row, categories)}
                    </span>
                  ),
                },
                {
                  field: 'sellingPrice',
                  header: 'Selling Price',
                  sortable: true,
                  render: row => <span className="font-semibold text-[#0F2A4A]">{money(row.sellingPrice)}</span>,
                },
                {
                  field: 'productionCost',
                  header: 'Production Cost',
                  sortable: true,
                  render: row => <span className="font-semibold text-[#0F2A4A]">{money(row.productionCost)}</span>,
                },
                {
                  field: 'status',
                  header: 'Status',
                  sortable: true,
                  filterable: true,
                  filterType: 'boolean',
                  getValue: row => designStatus(row) === 'ACTIVE',
                },
                {
                  field: 'actions',
                  header: 'Actions',
                  render: row => (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => viewDesign(row)}
                        className="theme-secondary-btn rounded-lg p-2"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openNeedForm(row)}
                        className="theme-secondary-btn rounded-lg p-2"
                        title="Supplementary materials"
                      >
                        <Settings2 className="h-4 w-4" />
                      </button>
                      {canUpdate && (
                        <button
                          onClick={() => openDesignForm(row)}
                          className="theme-secondary-btn rounded-lg p-2"
                          title="Edit design"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete && (
                        <>
                          <button
                            onClick={() => markDesignInactive(row)}
                            className="theme-secondary-btn rounded-lg p-2"
                            title="Mark Inactive"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                          </button>
                          <button
                            onClick={() => deleteDesign(row)}
                            className="theme-danger-btn rounded-lg p-2"
                            title="Delete design"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>
      )}

      {/* Modals */}
      {modalMode === 'design' && Object.keys(designForm).length > 0 && (
        <SimpleRecordModal
          title={editingDesign ? 'Edit Design' : 'Add Design'}
          subtitle={
            editingDesign
              ? 'Update design details (code cannot be changed)'
              : 'Fields: name, code, category, selling price, production cost'
          }
          fields={editingDesign ? designFields.filter(f => f.name !== 'code') : designFields}
          values={designForm}
          saving={saving}
          apiError={formError}
          submitLabel={editingDesign ? 'Update Design' : 'Create Design'}
          onChange={(name, value) => setDesignForm(form => ({ ...form, [name]: value }))}
          onClose={closeModal}
          onSubmit={saveDesign}
        />
      )}

      {modalMode === 'need' && Object.keys(needForm).length > 0 && (() => {
        const selectedMat = rawMaterials.find(m => m.id === needForm.rawMaterialId);
        const matUnit = selectedMat?.unit || '';
        const matName = selectedMat?.name || 'selected raw material';
        const isDozen = needForm.unit === 'DOZEN';
        const quantity = needForm.quantityRequired || 0;
        
        const formulaPreview = isDozen
          ? `1 Dozen requires ${quantity} ${matUnit} of ${matName}.`
          : `1 Finished Piece requires ${quantity} ${matUnit} of ${matName}.`;

        return (
          <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
            <form onSubmit={saveNeed} className="theme-modal-panel flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-4">
                <div>
                  <h2 className="text-xl font-bold theme-text-primary">
                    {editingNeed ? 'Edit Supplementary Need' : 'Add Supplementary Need'}
                  </h2>
                  {selectedDesign && (
                    <p className="text-sm text-slate-500">
                      Design: {selectedDesign.name || designCode(selectedDesign)}
                    </p>
                  )}
                </div>
                <button type="button" onClick={closeModal} className="theme-secondary-btn rounded-lg p-2">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {formError && (
                <div className="mx-4 mt-4 whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {formError.message || 'Validation failed. Please correct the highlighted fields and try again.'}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Raw Material Select / Label */}
                  {editingNeed ? (
                    <div className="md:col-span-2">
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Raw Material
                        </span>
                        <div className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 flex items-center">
                          {matName}
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="md:col-span-2">
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Raw Material <span className="text-red-500">*</span>
                        </span>
                        <PremiumSelect
                          required
                          value={needForm.rawMaterialId || ''}
                          onChange={(e: any) => {
                            const val = e.target.value;
                            setNeedForm(form => {
                              const updated = { ...form, rawMaterialId: val } as any;
                              const selectedMat = rawMaterials.find(m => m.id === val);
                              if (selectedMat) {
                                updated.unit = selectedMat.unit === 'DOZEN' ? 'DOZEN' : 'PIECE';
                              }
                              return updated;
                            });
                          }}
                          className="h-10 w-full text-sm font-semibold rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-[var(--color-accent)]"
                        >
                          <option value="">Select Raw Material</option>
                          {rawMaterials.map(item => {
                            const avail = item.currentStock ?? item.stock?.quantityAvailable ?? 0;
                            return (
                              <option key={item.id} value={item.id}>
                                {item.name || 'Material'} ({item.unit || 'unit'}) — {Number(avail).toLocaleString()} avail
                              </option>
                            );
                          })}
                        </PremiumSelect>
                      </label>
                    </div>
                  )}

                  {/* Consumption Quantity */}
                  <div>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Consumption Quantity <span className="text-red-500">*</span>
                      </span>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          step="any"
                          required
                          value={needForm.quantityRequired ?? ''}
                          onChange={e => setNeedForm(form => ({ ...form, quantityRequired: e.target.value }))}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-16 text-sm outline-none focus:border-[var(--color-accent)]"
                          placeholder="e.g. 0.5"
                        />
                        {matUnit && (
                          <div className="absolute right-0 flex h-full items-center text-xs font-bold text-slate-500 bg-slate-50 border-l border-slate-200 px-3 rounded-r-lg">
                            {matUnit}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Production Basis */}
                  <div>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Production Basis <span className="text-red-500">*</span>
                      </span>
                      <PremiumSelect
                        required
                        value={needForm.unit || 'PIECE'}
                        onChange={(e: any) => setNeedForm(form => ({ ...form, unit: e.target.value }))}
                        className="h-10 w-full text-sm font-semibold rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-[var(--color-accent)]"
                      >
                        <option value="PIECE">Per Piece</option>
                        <option value="DOZEN">Per Dozen</option>
                      </PremiumSelect>
                    </label>
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Notes
                      </span>
                      <textarea
                        value={needForm.notes || ''}
                        onChange={e => setNeedForm(form => ({ ...form, notes: e.target.value }))}
                        rows={2}
                        placeholder="Optional notes"
                        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[var(--color-accent)]"
                      />
                    </label>
                  </div>
                </div>

                {/* Formula Preview Block */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
                    Formula Preview
                  </span>
                  <p className="text-sm font-bold text-indigo-900">
                    Formula: <span className="font-semibold text-slate-800">{formulaPreview}</span>
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 p-4">
                <button type="button" onClick={closeModal} className="theme-secondary-btn rounded-lg px-4 py-2 text-sm font-semibold">
                  Cancel
                </button>
                <button disabled={saving} className="theme-accent-btn rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">
                  {saving ? 'Saving...' : editingNeed ? 'Update Need' : 'Add Need'}
                </button>
              </div>
            </form>
          </div>
        );
      })()}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        isDestructive={true}
      />
    </DashboardLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">{label}</p>
      <p className="text-[14px] font-bold theme-text-primary">{value}</p>
    </div>
  );
}

function SupplementaryNeeds({
  design,
  needs,
  canUpdate,
  canDelete,
  onAdd,
  onEdit,
  onDelete,
  rawMaterials = [],
}: {
  design: BackendRecord;
  needs: BackendRecord[];
  canUpdate: boolean;
  canDelete: boolean;
  onAdd: (design: BackendRecord) => void;
  onEdit: (design: BackendRecord, need: BackendRecord) => void;
  onDelete: (design: BackendRecord, need: BackendRecord) => void;
  rawMaterials?: BackendRecord[];
}) {
  return (
    <div className="mt-4 rounded-lg border border-[#f3f4f6] bg-[#fafafa] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
          Supplementary Materials
        </p>
        {canUpdate && (
          <button
            onClick={() => onAdd(design)}
            className="theme-secondary-btn inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        )}
      </div>
      {needs.length === 0 ? (
        <p className="text-xs text-[#6b7280]">No supplementary materials assigned.</p>
      ) : (
        <div className="space-y-2">
          {needs.map(need => {
            const material = rawMaterials.find(rm => rm.id === need.rawMaterialId);
            return (
              <div
                key={need.id || `${need.rawMaterialId}-${need.quantityRequired}`}
                className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-xs"
              >
                <div>
                  <p className="font-semibold theme-text-primary">
                    {material?.name || need.rawMaterial?.name || materialName(need)}
                  </p>
                  <p className="text-[#6b7280]">
                    Qty: {need.quantityRequired || '-'} {need.unit || ''}
                  </p>
                </div>
                <div className="flex gap-1">
                  {canUpdate && (
                    <button
                      onClick={() => onEdit(design, need)}
                      className="rounded-md p-1 text-[#6b7280] hover:bg-[#f3f4f6]"
                      title="Edit need"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => onDelete(design, need)}
                      className="rounded-md p-1 text-[#cc2200] hover:bg-[#fff0f0]"
                      title="Remove need"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DesignDetails({
  design,
  categories,
  needs,
  rawMaterials = [],
  onBack,
  canUpdate,
  canDelete,
  onEditDesign,
  onDeleteDesign,
  onMarkInactive,
  onAddNeed,
  onEditNeed,
  onDeleteNeed,
}: {
  design: BackendRecord;
  categories: BackendRecord[];
  needs: BackendRecord[];
  rawMaterials?: BackendRecord[];
  onBack: () => void;
  canUpdate: boolean;
  canDelete: boolean;
  onEditDesign: (design: BackendRecord) => void;
  onDeleteDesign: (design: BackendRecord) => void;
  onMarkInactive?: (design: BackendRecord) => void;
  onAddNeed: (design: BackendRecord) => void;
  onEditNeed: (design: BackendRecord, need: BackendRecord) => void;
  onDeleteNeed: (design: BackendRecord, need: BackendRecord) => void;
}) {
  const images = design.images || [];
  const allImages = images.length > 0
    ? images.map((img: any) => backendAssetUrl(img.url)).filter(Boolean)
    : [primaryDesignImage(design)].filter(Boolean);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const profit = Number(design.sellingPrice || 0) - Number(design.productionCost || 0);
  const margin =
    Number(design.sellingPrice || 0) > 0 ? (profit / Number(design.sellingPrice)) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Catalogue
      </button>

      {/* Header Info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between rounded-xl bg-white p-6 border border-slate-200 shadow-sm">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{design.name || 'Unnamed Design'}</h1>
            <StatusPill status={designStatus(design)} />
          </div>
          <p className="text-sm font-medium text-slate-500">
            {designCode(design)} &bull; {resolveCategoryName(design, categories)}
          </p>
          {design.description && (
            <p className="mt-3 text-sm text-slate-600 max-w-2xl">{design.description}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {canUpdate && (
            <button
              onClick={() => onEditDesign(design)}
              className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
            >
              <Edit3 className="h-4 w-4" /> Edit
            </button>
          )}
          {canDelete && onMarkInactive && (
            <button
              onClick={() => onMarkInactive(design)}
              className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
              title="Mark Inactive"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
              Inactive
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDeleteDesign(design)}
              className="theme-danger-btn inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Images & Additional Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Image Gallery</h3>
            {allImages.length > 0 ? (
              <div className="space-y-4">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center">
                  <img
                    src={allImages[activeImageIndex]}
                    alt="Design Preview"
                    className="h-full w-full object-contain"
                    onError={e => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                      el.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                    }}
                  />
                </div>
                {allImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {allImages.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${activeImageIndex === idx ? 'border-slate-900' : 'border-transparent'} bg-slate-100 transition-all`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          className="h-full w-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
                <ImageIcon className="mb-2 h-8 w-8" />
                <p className="text-sm font-medium">No images uploaded</p>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Additional Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Metric label="Design Code" value={designCode(design)} />
              <Metric label="Category" value={resolveCategoryName(design, categories)} />
              <Metric
                label="Created Date"
                value={design.createdAt ? new Date(design.createdAt).toLocaleDateString() : '-'}
              />
              <Metric
                label="Last Updated"
                value={design.updatedAt ? new Date(design.updatedAt).toLocaleDateString() : '-'}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Supplementary */}
        <div className="space-y-6">
          {/* Pricing Section */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Pricing Details</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-sm font-medium text-slate-500">Selling Price</span>
                <span className="font-bold text-slate-900">{money(design.sellingPrice)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-sm font-medium text-slate-500">Production Cost</span>
                <span className="font-bold text-slate-900">{money(design.productionCost)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-sm font-medium text-slate-500">Profit Amount</span>
                <span className={`font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {money(profit)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Profit Margin</span>
                <span className={`font-bold ${margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {margin.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Supplementary Materials Section */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Supplementary Materials</h3>
            <SupplementaryNeeds
              design={design}
              needs={needs}
              rawMaterials={rawMaterials}
              canUpdate={canUpdate}
              canDelete={canDelete}
              onAdd={onAddNeed}
              onEdit={onEditNeed}
              onDelete={onDeleteNeed}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
