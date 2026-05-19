'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Plus, Grid2X2, List, Layers, Gem, Edit3, Trash2, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonCard, SkeletonTable } from '@/components/skeleton/Skeletons';
import { DataTable } from '@/components/shared/DataTable';
import { SimpleRecordModal, SimpleField } from '@/components/shared/simple-record-modal';
import { SearchInput } from '@/components/shared/search-input';
import { formatCurrency } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';
import { CurrentTenantService } from '@/lib/services/current-tenant.service';
import {
  BackendRecord,
  DesignService,
  responseItems,
  SupplementaryService,
} from '@/lib/services/business-modules.service';
import { BackendTenant } from '@/lib/types';

type ViewMode = 'grid' | 'list';
type ModalMode = 'design' | 'category' | 'need' | null;

function money(value: unknown) {
  return formatCurrency(Number(value || 0));
}

function categoryName(design: BackendRecord) {
  return design.category?.name || design.categoryName || design.category || 'Uncategorized';
}

function designCode(design: BackendRecord) {
  return design.code || design.designCode || design.sku || '-';
}

function designStatus(design: BackendRecord) {
  return String(design.status || (design.isActive === false ? 'INACTIVE' : 'ACTIVE')).toLowerCase();
}

function materialName(item: BackendRecord) {
  return item.materialType?.name || item.material?.name || item.supplementaryMaterialType?.name || item.name || 'Material';
}

export default function DesignCataloguePage() {
  const { hasPermission } = useAuth();
  const [tenant, setTenant] = useState<BackendTenant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [loading, setLoading] = useState(true);
  const [designs, setDesigns] = useState<BackendRecord[]>([]);
  const [categories, setCategories] = useState<BackendRecord[]>([]);
  const [supplementary, setSupplementary] = useState<BackendRecord[]>([]);
  const [seeding, setSeeding] = useState(false);
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

  const canCreate = hasPermission('designs.create');
  const canUpdate = hasPermission('designs.update');
  const canDelete = hasPermission('designs.delete');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const tenantRes = await CurrentTenantService.getCurrentTenant();
      if (!tenantRes.success || !tenantRes.data) {
        toast.error(tenantRes.error?.message || 'No business tenant found');
        return;
      }

      setTenant(tenantRes.data);
      const [designRes, categoryRes, supplementaryRes] = await Promise.all([
        DesignService.list(tenantRes.data.id, { page: 1, limit: 100 }),
        DesignService.listCategories(tenantRes.data.id, { page: 1, limit: 100 }),
        SupplementaryService.list(tenantRes.data.id, { page: 1, limit: 100 }),
      ]);

      if (designRes.success) setDesigns(responseItems(designRes.data));
      else toast.error(designRes.error?.message || 'Failed to load designs');

      if (categoryRes.success) setCategories(responseItems(categoryRes.data));
      if (supplementaryRes.success) setSupplementary(responseItems(supplementaryRes.data));

      if (designRes.success) {
        const loadedDesigns = responseItems(designRes.data);
        const tenantId = tenantRes.data.id;
        const needEntries = await Promise.all(
          loadedDesigns
            .filter(design => design.id)
            .map(async design => {
              const response = await DesignService.listSupplementaryNeeds(tenantId, design.id);
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
  }, [searchTerm, selectedCategory]);



  const designFields: SimpleField[] = [
    { name: 'categoryId', label: 'Category', type: 'select', required: true, options: categories.map(category => ({ label: category.name || category.title || 'Category', value: category.id })) },
    { name: 'designCode', label: 'Design Code', required: true },
    { name: 'name', label: 'Name', required: true },
    { name: 'diamondCount', label: 'Diamond Count', type: 'number', required: true },
    { name: 'pieceRateRs', label: 'Piece Rate Rs', type: 'number', required: true },
    { name: 'salePricePerDozen', label: 'Sale Price / Dozen', type: 'number', required: true },
    { name: 'material', label: 'Material' },
    { name: 'finish', label: 'Finish' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const categoryFields: SimpleField[] = [
    { name: 'name', label: 'Category Name', required: true },
    { name: 'sortOrder', label: 'Sort Order', type: 'number' },
    ...(editingCategory ? [{ name: 'isActive', label: 'Active', type: 'checkbox' as const }] : []),
  ];

  const needFields: SimpleField[] = [
    { name: 'materialTypeId', label: 'Supplementary Material', type: 'select', required: true, options: supplementary.map(item => ({ label: `${item.name || 'Material'} (${item.unit || 'unit'})`, value: item.id })) },
    { name: 'quantityPerPiece', label: 'Quantity Per Piece', type: 'number', required: true },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const openDesignForm = (design?: BackendRecord) => {
    setEditingDesign(design || null);
    setModalMode('design');
    setDesignForm(design ? {
      categoryId: design.categoryId || design.category?.id || '',
      designCode: design.designCode || design.code || '',
      name: design.name || '',
      diamondCount: design.diamondCount || 0,
      pieceRateRs: design.pieceRateRs || design.pieceRate || design.workerRatePerPiece || '',
      salePricePerDozen: design.salePricePerDozen || design.sellingPricePerDozen || '',
      material: design.material || '',
      finish: design.finish || '',
      notes: design.notes || '',
    } : {
      categoryId: categories[0]?.id || '',
      designCode: `DES-${Date.now().toString().slice(-5)}`,
      name: '',
      diamondCount: 0,
      pieceRateRs: '',
      salePricePerDozen: '',
      material: '',
      finish: '',
      notes: '',
    });
  };

  const openCategoryForm = (category?: BackendRecord) => {
    setEditingCategory(category || null);
    setModalMode('category');
    setCategoryForm(category ? {
      name: category.name || '',
      sortOrder: category.sortOrder ?? 0,
      isActive: category.isActive !== false,
    } : {
      name: '',
      sortOrder: categories.length,
    });
  };

  const openNeedForm = (design: BackendRecord, need?: BackendRecord) => {
    setSelectedDesign(design);
    setEditingNeed(need || null);
    setModalMode('need');
    setNeedForm(need ? {
      materialTypeId: need.materialTypeId || need.materialType?.id || need.supplementaryMaterialTypeId || need.supplementaryMaterialType?.id || '',
      quantityPerPiece: need.quantityPerPiece || '',
      notes: need.notes || '',
    } : {
      materialTypeId: supplementary[0]?.id || '',
      quantityPerPiece: '',
      notes: '',
    });
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

  const saveDesign = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentTenant = tenant || (await CurrentTenantService.getCurrentTenant()).data;
    if (!currentTenant?.id) return toast.error('Tenant not found');

    setSaving(true);
    try {
      const payload = {
        ...designForm,
        diamondCount: Number(designForm.diamondCount || 0),
        pieceRateRs: Number(designForm.pieceRateRs || 0),
        salePricePerDozen: Number(designForm.salePricePerDozen || 0),
        status: editingDesign?.status || 'ACTIVE',
      };
      const response = editingDesign?.id
        ? await DesignService.update(currentTenant.id, editingDesign.id, payload)
        : await DesignService.create(currentTenant.id, payload);

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
    const currentTenant = tenant || (await CurrentTenantService.getCurrentTenant()).data;
    if (!currentTenant?.id) return toast.error('Tenant not found');

    setSaving(true);
    try {
      const payload = {
        ...categoryForm,
        sortOrder: Number(categoryForm.sortOrder || 0),
      };
      const response = editingCategory?.id
        ? await DesignService.updateCategory(currentTenant.id, editingCategory.id, payload)
        : await DesignService.createCategory(currentTenant.id, payload);

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
    const currentTenant = tenant || (await CurrentTenantService.getCurrentTenant()).data;
    if (!currentTenant?.id || !category.id) return toast.error('Tenant or category not found');
    if (!window.confirm(`Deactivate category ${category.name || 'this category'}?`)) return;

    const response = await DesignService.deleteCategory(currentTenant.id, category.id);
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
    const currentTenant = tenant || (await CurrentTenantService.getCurrentTenant()).data;
    if (!currentTenant?.id || !selectedDesign?.id) return toast.error('Tenant or design not found');

    setSaving(true);
    try {
      const payload = {
        materialTypeId: needForm.materialTypeId,
        quantityPerPiece: Number(needForm.quantityPerPiece || 0),
        notes: needForm.notes || undefined,
      };
      const response = editingNeed?.id
        ? await DesignService.updateSupplementaryNeed(currentTenant.id, selectedDesign.id, editingNeed.id, {
            quantityPerPiece: payload.quantityPerPiece,
            notes: payload.notes,
          })
        : await DesignService.addSupplementaryNeed(currentTenant.id, selectedDesign.id, payload);

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
    const currentTenant = tenant || (await CurrentTenantService.getCurrentTenant()).data;
    if (!currentTenant?.id || !design.id || !need.id) return toast.error('Tenant, design, or need not found');
    if (!window.confirm('Remove this supplementary need?')) return;

    const response = await DesignService.deleteSupplementaryNeed(currentTenant.id, design.id, need.id);
    if (response.success) {
      toast.success('Supplementary need removed');
      await loadData();
    } else {
      toast.error(response.error?.message || 'Failed to remove supplementary need');
    }
  };

  const deleteDesign = async (design: BackendRecord) => {
    const currentTenant = tenant || (await CurrentTenantService.getCurrentTenant()).data;
    if (!currentTenant?.id || !design.id) return toast.error('Tenant or design not found');
    if (!window.confirm(`Delete ${design.name || designCode(design)}?`)) return;

    const response = await DesignService.delete(currentTenant.id, design.id);
    if (response.success) {
      toast.success('Design deleted');
      await loadData();
    } else {
      toast.error(response.error?.message || 'Failed to delete design');
    }
  };

  const filteredDesigns = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return designs.filter(design => {
      const matchesSearch =
        String(design.name || '').toLowerCase().includes(term) ||
        String(designCode(design)).toLowerCase().includes(term);
      const matchesCategory = !selectedCategory || categoryName(design) === selectedCategory || design.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [designs, searchTerm, selectedCategory]);

  const paginatedDesigns = useMemo(() => filteredDesigns.slice((page - 1) * itemsPerPage, page * itemsPerPage), [filteredDesigns, page]);

  return (
    <DashboardLayout
      title="Design Catalogue"
      subtitle="Backend connected designs, categories, and supplementary requirements"
      action={
        <div className="flex flex-wrap gap-2">
          {canCreate && (
            <button onClick={() => openCategoryForm()} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold">
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          )}
          {canCreate && (
            <button onClick={() => openDesignForm()} className="inline-flex items-center gap-2 rounded-lg theme-accent-btn px-5 py-2.5 text-sm font-semibold transition-colors">
              <Plus className="h-4 w-4" />
              Add Design
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard icon={<Gem className="h-5 w-5" />} label="Designs" value={designs.length} />
          <SummaryCard icon={<Grid2X2 className="h-5 w-5" />} label="Categories" value={categories.length} />
          <SummaryCard icon={<Layers className="h-5 w-5" />} label="Supplementary Items" value={supplementary.length} />
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div className="flex w-full flex-1 gap-2 sm:w-auto">
            <SearchInput
              containerClassName="max-w-md flex-1"
              inputClassName="h-9 rounded-lg border-[#e5e7eb] bg-[#f9fafb] focus:border-[#0F2A4A]"
              placeholder="Search designs..."
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
            />
            {/* Refresh button removed — auto-refresh on route change */}
          </div>

          <div className="flex shrink-0 gap-2">
            <button onClick={() => setViewMode('grid')} className={`rounded-lg border border-[#e5e7eb] p-2 transition-colors ${viewMode === 'grid' ? 'theme-tab-active' : 'bg-white text-[#6b7280]'}`}>
              <Grid2X2 className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`rounded-lg border border-[#e5e7eb] p-2 transition-colors ${viewMode === 'list' ? 'theme-tab-active' : 'bg-white text-[#6b7280]'}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
          <button onClick={() => setSelectedCategory(null)} className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-[13px] font-medium ${!selectedCategory ? 'theme-tab-active' : 'border-[#e5e7eb] bg-white text-[#6b7280]'}`}>
            All Categories
          </button>
          {categories.map(category => {
            const key = category.id || category.name;
            const label = category.name || category.title || 'Category';
            return (
              <div key={key} className={`flex items-center overflow-hidden rounded-full border ${selectedCategory === key ? 'theme-tab-active' : 'border-[#e5e7eb] bg-white text-[#6b7280]'}`}>
                <button onClick={() => setSelectedCategory(key)} className="whitespace-nowrap px-4 py-1.5 text-[13px] font-medium">
                  {label}
                </button>
                <button onClick={() => openCategoryForm(category)} className="border-l border-current/10 px-2 py-1.5" title="Edit category">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                {canDelete && (
                  <button onClick={() => deleteCategory(category)} className="border-l border-current/10 px-2 py-1.5" title="Deactivate category">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {loading && (viewMode === 'grid' ? <SkeletonCard count={6} /> : <SkeletonTable rows={8} cols={6} />)}

        {!loading && viewMode === 'grid' && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {paginatedDesigns.map(design => (
              <div key={design.id} className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white theme-card-accent">
                <div className="flex h-40 items-center justify-center border-b border-[#e5e7eb] bg-[#f0f2f5]">
                  <div className="text-center">
                    <Gem className="mx-auto mb-2 h-8 w-8 text-[#9ca3af]" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">{categoryName(design)}</p>
                  </div>
                </div>
                <div className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <span className="mb-1.5 inline-block rounded bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-semibold text-[#6b7280]">{designCode(design)}</span>
                      <h3 className="text-[16px] font-bold leading-tight theme-text-primary">{design.name || 'Unnamed Design'}</h3>
                    </div>
                    <StatusPill status={designStatus(design)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-[#f3f4f6] pt-4">
                    <Metric label="Piece Rate" value={money(design.pieceRateRs || design.pieceRate || design.workerRatePerPiece)} />
                    <Metric label="Dozen Rate" value={money(design.salePricePerDozen || design.sellingPricePerDozen)} />
                  </div>
                  <SupplementaryNeeds
                    design={design}
                    needs={needsByDesignId[design.id] || []}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    onAdd={openNeedForm}
                    onEdit={openNeedForm}
                    onDelete={deleteNeed}
                  />
                  <div className="mt-4 flex justify-end gap-2 border-t border-[#f3f4f6] pt-4">
                    {canUpdate && <button onClick={() => openDesignForm(design)} className="theme-secondary-btn rounded-lg p-2" title="Edit design"><Edit3 className="h-4 w-4" /></button>}
                    {canDelete && <button onClick={() => deleteDesign(design)} className="theme-danger-btn rounded-lg p-2" title="Delete design"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {paginatedDesigns.length > 0 && viewMode === 'grid' && (
          <div className="flex flex-col gap-3 border-t border-[#f3f4f6] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-[#6b7280]">
                Page {page} of {Math.max(Math.ceil(filteredDesigns.length / itemsPerPage), 1)} / {filteredDesigns.length} total
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#6b7280]">Rows:</span>
                <select
                  value={itemsPerPage}
                  onChange={e => {
                    setItemsPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded-lg border border-[#e5e7eb] bg-white px-2 text-sm font-semibold text-[#374151] outline-none transition"
                >
                  <option value="6">6</option>
                  <option value="12">12</option>
                  <option value="18">18</option>
                  <option value="24">24</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(value => Math.max(1, value - 1))}
                className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= Math.ceil(filteredDesigns.length / itemsPerPage)}
                onClick={() => setPage(value => value + 1)}
                className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {!loading && viewMode === 'list' && (
          <DataTable
            headers={['Code', 'Name', 'Category', 'Piece Rate', 'Dozen Rate', 'Status', 'Actions']}
            loading={loading}
            page={page}
            totalPages={Math.ceil(filteredDesigns.length / itemsPerPage)}
            totalItems={filteredDesigns.length}
            onPageChange={setPage}
            limit={itemsPerPage}
            onLimitChange={setItemsPerPage}
            emptyIcon={<Gem className="h-6 w-6 text-slate-400" />}
            emptyTitle="No designs found"
            emptySubtitle={tenant ? 'Try adjusting search or filters.' : 'A tenant is required before designs can be loaded.'}
          >
            {paginatedDesigns.map((design, index) => (
              <tr key={design.id} className="theme-table-row">
                <td className="px-5 py-3.5 text-sm font-semibold text-[#0F2A4A]">
                  <div className="flex items-center gap-3">
                    <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg">
                      <Gem className="h-4 w-4" />
                    </div>
                    {designCode(design)}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm font-bold text-[#374151]">{design.name || '-'}</td>
                <td className="px-5 py-3.5 text-sm text-[#6b7280]">{categoryName(design)}</td>
                <td className="px-5 py-3.5 text-sm font-semibold text-[#0F2A4A]">{money(design.pieceRateRs || design.pieceRate || design.workerRatePerPiece)}</td>
                <td className="px-5 py-3.5 text-sm font-semibold text-[#0F2A4A]">{money(design.salePricePerDozen || design.sellingPricePerDozen)}</td>
                <td className="px-5 py-3.5"><StatusPill status={designStatus(design)} /></td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openNeedForm(design)} className="theme-secondary-btn rounded-lg p-2" title="Supplementary needs"><Settings2 className="h-4 w-4" /></button>
                    {canUpdate && <button onClick={() => openDesignForm(design)} className="theme-secondary-btn rounded-lg p-2" title="Edit design"><Edit3 className="h-4 w-4" /></button>}
                    {canDelete && <button onClick={() => deleteDesign(design)} className="theme-danger-btn rounded-lg p-2" title="Delete design"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}


      </div>

      {modalMode === 'design' && Object.keys(designForm).length > 0 && (
        <SimpleRecordModal
          title={editingDesign ? 'Edit Design' : 'Add Design'}
          subtitle="Fields follow the Swagger CreateDesignRequest contract"
          fields={designFields}
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
          subtitle="Fields follow the Swagger design category request contract"
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
          fields={needFields}
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

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 theme-card-accent">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f2f5] text-[#0F2A4A]">{icon}</div>
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

function StatusPill({ status }: { status: string }) {
  const active = status === 'active';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${active ? 'theme-badge-soft' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
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
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">Supplementary Needs</p>
        <button onClick={() => onAdd(design)} className="theme-secondary-btn inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold">
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>
      {needs.length === 0 ? (
        <p className="text-xs text-[#6b7280]">No supplementary template added.</p>
      ) : (
        <div className="space-y-2">
          {needs.map(need => (
            <div key={need.id || `${need.materialTypeId}-${need.quantityPerPiece}`} className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-xs">
              <div>
                <p className="font-semibold theme-text-primary">{materialName(need)}</p>
                <p className="text-[#6b7280]">Qty/piece: {need.quantityPerPiece || '-'}</p>
              </div>
              <div className="flex gap-1">
                {canUpdate && (
                  <button onClick={() => onEdit(design, need)} className="rounded-md p-1 text-[#6b7280] hover:bg-[#f3f4f6]" title="Edit need">
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => onDelete(design, need)} className="rounded-md p-1 text-[#cc2200] hover:bg-[#fff0f0]" title="Remove need">
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
