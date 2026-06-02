'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  Plus, Grid2X2, List, Layers, Gem, Edit3, Trash2, Settings2,
  Filter, X, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonCard, SkeletonTable } from '@/components/skeleton/Skeletons';
import { AdvancedDataTable, ColumnDef } from '@/components/shared/DataTable';
import { SimpleRecordModal, SimpleField } from '@/components/shared/simple-record-modal';
import { SearchInput } from '@/components/shared/search-input';
import { formatCurrency } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';
import {
  BackendRecord,
  DesignService,
  responseItems,
  SupplementaryService,
} from '@/lib/services/business-modules.service';

type ViewMode = 'grid' | 'list';
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
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list'); // Default to list since user requested the table back
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [designs, setDesigns] = useState<BackendRecord[]>([]);
  const [categories, setCategories] = useState<BackendRecord[]>([]);
  const [rawMaterials, setRawMaterials] = useState<BackendRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingDesign, setEditingDesign] = useState<BackendRecord | null>(null);
  const [editingCategory, setEditingCategory] = useState<BackendRecord | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<BackendRecord | null>(null);
  const [editingNeed, setEditingNeed] = useState<BackendRecord | null>(null);
  const [designForm, setDesignForm] = useState<Record<string, any>>({});
  const [categoryForm, setCategoryForm] = useState<Record<string, any>>({});
  const [needForm, setNeedForm] = useState<Record<string, any>>({});
  const [needsByDesignId, setNeedsByDesignId] = useState<Record<string, BackendRecord[]>>({});

  // Column filter state
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

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
      options: rawMaterials.map(item => ({
        label: `${item.name || 'Material'} (${item.unit || 'unit'})`,
        value: item.id,
      })),
    },
    { name: 'quantityRequired', label: 'Quantity Required', type: 'number', required: true },
    {
      name: 'unit',
      label: 'Unit',
      type: 'select',
      required: true,
      options: [
        { label: 'KG', value: 'KG' },
        { label: 'Gram', value: 'GRAM' },
        { label: 'Piece', value: 'PIECE' },
        { label: 'Meter', value: 'METER' },
        { label: 'Dozen', value: 'DOZEN' },
        { label: 'Other', value: 'OTHER' },
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
    setNeedForm(
      need
        ? {
            rawMaterialId: need.rawMaterialId || need.rawMaterial?.id || '',
            quantityRequired: need.quantityRequired || '',
            unit: need.unit || 'PIECE',
            notes: need.notes || '',
          }
        : {
            rawMaterialId: rawMaterials[0]?.id || '',
            quantityRequired: '',
            unit: 'PIECE',
            notes: '',
          }
    );
  };

  const closeModal = () => {
    setModalMode(null);
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
      const payload = {
        categoryId: designForm.categoryId,
        name: designForm.name,
        sellingPrice: Number(designForm.sellingPrice || 0),
        productionCost: Number(designForm.productionCost || 0),
        description: designForm.description || undefined,
        ...(editingDesign?.id ? {} : { code: designForm.code }),
      };

      const response = editingDesign?.id
        ? await DesignService.update('', editingDesign.id, payload)
        : await DesignService.create('', payload);

      if (!response.success) throw new Error(response.error?.message || 'Failed to save design');
      toast.success(editingDesign ? 'Design updated' : 'Design created');
      closeModal();
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save design');
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

      if (!response.success) throw new Error(response.error?.message || 'Failed to save category');
      toast.success(editingCategory ? 'Category updated' : 'Category created');
      closeModal();
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (category: BackendRecord) => {
    if (!category.id) return toast.error('Category not found');
    if (!window.confirm(`Deactivate category "${category.name || 'this category'}"?`)) return;

    const response = await DesignService.deleteCategory('', category.id);
    if (response.success) {
      toast.success('Category deactivated');
      if (selectedCategory === category.id) setSelectedCategory(null);
      await loadData();
    } else {
      toast.error(response.error?.message || 'Failed to deactivate category');
    }
  };

  const saveNeed = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedDesign?.id) return toast.error('Design not found');
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

      if (!response.success) throw new Error(response.error?.message || 'Failed to save supplementary need');
      toast.success(editingNeed ? 'Supplementary need updated' : 'Supplementary need added');
      closeModal();
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save supplementary need');
    } finally {
      setSaving(false);
    }
  };

  const deleteNeed = async (design: BackendRecord, need: BackendRecord) => {
    if (!design.id || !need.id) return toast.error('Design or need not found');
    if (!window.confirm('Remove this supplementary need?')) return;

    const response = await DesignService.deleteSupplementaryNeed('', design.id, need.id);
    if (response.success) {
      toast.success('Supplementary need removed');
      await loadData();
    } else {
      toast.error(response.error?.message || 'Failed to remove supplementary need');
    }
  };

  const deleteDesign = async (design: BackendRecord) => {
    if (!design.id) return toast.error('Design not found');
    if (!window.confirm(`Deactivate "${design.name || designCode(design)}"?`)) return;

    const response = await DesignService.delete('', design.id);
    if (response.success) {
      toast.success('Design deactivated');
      await loadData();
    } else {
      toast.error(response.error?.message || 'Failed to deactivate design');
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
        filterStatus.length === 0 ||
        filterStatus.includes(designStatus(design));

      return matchesSearch && matchesCategory && matchesFilterCategory && matchesFilterStatus;
    });
  }, [designs, searchTerm, selectedCategory, filterCategories, filterStatus]);

  const paginatedDesigns = useMemo(
    () => filteredDesigns.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [filteredDesigns, page, itemsPerPage]
  );

  const activeFilters = filterCategories.length + filterStatus.length;

  // Options for headers
  const categoryFilterOptions = useMemo(() =>
    categories.map(c => ({ label: c.name || 'Unknown', value: c.id as string })),
    [categories]
  );
  
  const statusFilterOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <DashboardLayout
      title="Design Catalogue"
      subtitle="Manage designs, categories, and supplementary material requirements"
      action={
        <div className="flex flex-wrap gap-2">
          {canCreate && (
            <button
              onClick={() => openCategoryForm()}
              className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          )}
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
      }
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard icon={<Gem className="h-5 w-5" />} label="Designs" value={designs.length} />
          <SummaryCard icon={<Grid2X2 className="h-5 w-5" />} label="Categories" value={categories.length} />
          <SummaryCard icon={<Layers className="h-5 w-5" />} label="Raw Materials" value={rawMaterials.length} />
        </div>

        {/* Search & View Toggle */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div className="flex w-full flex-1 gap-2 sm:w-auto">
            <SearchInput
              containerClassName="max-w-md flex-1"
              inputClassName="h-9 rounded-lg border-[#e5e7eb] bg-[#f9fafb] focus:border-[#0F2A4A]"
              placeholder="Search designs..."
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
            />
            {activeFilters > 0 && (
              <button
                onClick={() => { setFilterCategories([]); setFilterStatus([]); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[12px] font-semibold text-[#6b7280] hover:bg-[#f3f4f6]"
              >
                <X className="h-3.5 w-3.5" />
                Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
              </button>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg border border-[#e5e7eb] p-2 transition-colors ${viewMode === 'grid' ? 'theme-tab-active' : 'bg-white text-[#6b7280]'}`}
            >
              <Grid2X2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg border border-[#e5e7eb] p-2 transition-colors ${viewMode === 'list' ? 'theme-tab-active' : 'bg-white text-[#6b7280]'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-[13px] font-medium ${!selectedCategory ? 'theme-tab-active' : 'border-[#e5e7eb] bg-white text-[#6b7280]'}`}
          >
            All ({designs.length})
          </button>
          {categories.map(category => {
            const key = category.id as string;
            const label = category.name || 'Category';
            const count = designs.filter(d => d.categoryId === key).length;
            return (
              <div
                key={key}
                className={`flex items-center overflow-hidden rounded-full border ${selectedCategory === key ? 'theme-tab-active' : 'border-[#e5e7eb] bg-white text-[#6b7280]'}`}
              >
                <button
                  onClick={() => setSelectedCategory(key)}
                  className="whitespace-nowrap px-4 py-1.5 text-[13px] font-medium"
                >
                  {label} ({count})
                </button>
                {canUpdate && (
                  <button
                    onClick={() => openCategoryForm(category)}
                    className="border-l border-current/10 px-2 py-1.5"
                    title="Edit category"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => deleteCategory(category)}
                    className="border-l border-current/10 px-2 py-1.5"
                    title="Deactivate category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Grid View */}
        {!loading && viewMode === 'grid' && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {paginatedDesigns.map(design => (
              <div key={design.id} className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white theme-card-accent">
                {/* Card Image Placeholder */}
                <div className="flex h-40 items-center justify-center border-b border-[#e5e7eb] bg-[#f0f2f5]">
                  <div className="text-center">
                    <Gem className="mx-auto mb-2 h-8 w-8 text-[#9ca3af]" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
                      {resolveCategoryName(design, categories)}
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <span className="mb-1.5 inline-block rounded bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-semibold text-[#6b7280]">
                        {designCode(design)}
                      </span>
                      <h3 className="text-[16px] font-bold leading-tight theme-text-primary">
                        {design.name || 'Unnamed Design'}
                      </h3>
                      {design.description && (
                        <p className="mt-1 text-[12px] text-[#6b7280] line-clamp-2">{design.description}</p>
                      )}
                    </div>
                    <StatusPill status={designStatus(design)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-[#f3f4f6] pt-4">
                    <Metric label="Selling Price" value={money(design.sellingPrice)} />
                    <Metric label="Production Cost" value={money(design.productionCost)} />
                  </div>

                  <SupplementaryNeeds
                    design={design}
                    needs={needsByDesignId[design.id as string] || []}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    onAdd={openNeedForm}
                    onEdit={openNeedForm}
                    onDelete={deleteNeed}
                  />

                  <div className="mt-4 flex justify-end gap-2 border-t border-[#f3f4f6] pt-4">
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
                      <button
                        onClick={() => deleteDesign(design)}
                        className="theme-danger-btn rounded-lg p-2"
                        title="Deactivate design"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View with DataTable */}
        {(!loading && viewMode === 'list') && (
          <AdvancedDataTable
            data={filteredDesigns}
            searchable={false}
            loading={loading}
            emptyIcon={<Gem className="h-6 w-6 text-slate-400" />}
            emptyTitle="No designs found"
            emptySubtitle="Try adjusting search or filters."
            columns={[
              {
                field: 'code',
                header: 'Code',
                sortable: true,
                filterable: true,
                filterType: 'text',
                render: (row) => (
                  <div className="flex items-center gap-3">
                    <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg">
                      <Gem className="h-4 w-4" />
                    </div>
                    {designCode(row)}
                  </div>
                )
              },
              {
                field: 'name',
                header: 'Name',
                sortable: true,
                filterable: true,
                filterType: 'text',
                render: (row) => (
                  <div>
                    <div className="font-bold text-[#374151]">{row.name || '-'}</div>
                    {row.description && (
                      <p className="mt-0.5 text-xs font-normal text-slate-500 max-w-xs truncate">{row.description}</p>
                    )}
                  </div>
                )
              },
              {
                field: 'category',
                header: 'Category',
                sortable: true,
                filterable: true,
                filterType: 'select',
                filterOptions: categories.map(c => ({ label: String(c.name), value: String(c.name) })),
                getValue: (row) => resolveCategoryName(row, categories),
                render: (row) => (
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    {resolveCategoryName(row, categories)}
                  </span>
                )
              },
              {
                field: 'sellingPrice',
                header: 'Selling Price',
                sortable: true,
                filterable: true,
                filterType: 'number',
                render: (row) => <span className="font-semibold text-[#0F2A4A]">{money(row.sellingPrice)}</span>
              },
              {
                field: 'productionCost',
                header: 'Production Cost',
                sortable: true,
                filterable: true,
                filterType: 'number',
                render: (row) => <span className="font-semibold text-[#0F2A4A]">{money(row.productionCost)}</span>
              },
              {
                field: 'status',
                header: 'Status',
                sortable: true,
                filterable: true,
                filterType: 'boolean',
                getValue: (row) => designStatus(row) === 'ACTIVE',
                render: (row) => <StatusPill status={designStatus(row)} />
              },
              {
                field: 'actions',
                header: 'Actions',
                render: (row) => (
                  <div className="flex justify-end gap-2">
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
                      <button
                        onClick={() => deleteDesign(row)}
                        className="theme-danger-btn rounded-lg p-2"
                        title="Deactivate design"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )
              }
            ]}
          />
        )}
      </div>

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
          submitLabel={editingDesign ? 'Update Design' : 'Create Design'}
          onChange={(name, value) => setDesignForm(form => ({ ...form, [name]: value }))}
          onClose={closeModal}
          onSubmit={saveDesign}
        />
      )}

      {modalMode === 'category' && Object.keys(categoryForm).length > 0 && (
        <SimpleRecordModal
          title={editingCategory ? 'Edit Category' : 'Add Category'}
          subtitle="Category name must be unique"
          fields={categoryFields}
          values={categoryForm}
          saving={saving}
          submitLabel={editingCategory ? 'Update Category' : 'Create Category'}
          onChange={(name, value) => setCategoryForm(form => ({ ...form, [name]: value }))}
          onClose={closeModal}
          onSubmit={saveCategory}
        />
      )}

      {modalMode === 'need' && Object.keys(needForm).length > 0 && (
        <SimpleRecordModal
          title={editingNeed ? 'Edit Supplementary Need' : 'Add Supplementary Need'}
          subtitle={selectedDesign ? `Design: ${selectedDesign.name || designCode(selectedDesign)}` : 'Supplementary need'}
          fields={editingNeed ? needFields.filter(f => f.name !== 'rawMaterialId') : needFields}
          values={needForm}
          saving={saving}
          submitLabel={editingNeed ? 'Update Need' : 'Add Need'}
          onChange={(name, value) => setNeedForm(form => ({ ...form, [name]: value }))}
          onClose={closeModal}
          onSubmit={saveNeed}
        />
      )}
    </DashboardLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 theme-card-accent">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f2f5] text-[#0F2A4A]">
        {icon}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">{label}</p>
      <p className="text-2xl font-bold theme-text-primary">{value}</p>
    </div>
  );
}

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
}: {
  design: BackendRecord;
  needs: BackendRecord[];
  canUpdate: boolean;
  canDelete: boolean;
  onAdd: (design: BackendRecord) => void;
  onEdit: (design: BackendRecord, need: BackendRecord) => void;
  onDelete: (design: BackendRecord, need: BackendRecord) => void;
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
          {needs.map(need => (
            <div
              key={need.id || `${need.rawMaterialId}-${need.quantityRequired}`}
              className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-xs"
            >
              <div>
                <p className="font-semibold theme-text-primary">{materialName(need)}</p>
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
          ))}
        </div>
      )}
    </div>
  );
}
