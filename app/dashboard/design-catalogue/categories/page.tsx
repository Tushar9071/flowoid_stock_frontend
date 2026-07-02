'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Plus, Edit3, Trash2, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdvancedDataTable } from '@/components/shared/DataTable';
import { SimpleRecordModal, SimpleField } from '@/components/shared/simple-record-modal';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { useAuth } from '@/lib/auth-context';
import { BackendRecord, DesignService, responseItems } from '@/lib/services/business-modules.service';

export default function DesignCategoriesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DesignCategoriesContent />
    </Suspense>
  );
}

function DesignCategoriesContent() {
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState<BackendRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<any>(null);
  
  const [modalMode, setModalMode] = useState<'category' | null>(null);
  const [editingCategory, setEditingCategory] = useState<BackendRecord | null>(null);
  const [categoryForm, setCategoryForm] = useState<Record<string, any>>({});
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const canCreate = hasPermission('designs.create');
  const canUpdate = hasPermission('designs.update');
  const canDelete = hasPermission('designs.delete');

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await DesignService.listCategories('', { page: 1, limit: 100 });
      if (res.success) {
        const fetchedCategories = responseItems(res.data);
        const categoriesWithCounts = await Promise.all(
          fetchedCategories.map(async (category: any) => {
            try {
              const designRes = await DesignService.list('', { categoryId: category.id, limit: 1 });
              const count = designRes.data?.pagination?.totalItems || 0;
              return { ...category, productCount: count };
            } catch (err) {
              return { ...category, productCount: 0 };
            }
          })
        );
        setCategories(categoriesWithCounts);
      } else {
        toast.error(res.error?.message || 'Failed to load categories');
      }
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  const pathname = usePathname();

  useEffect(() => {
    loadData();
  }, [loadData, pathname]);

  const categoryFields: SimpleField[] = [
    { name: 'name', label: 'Category Name', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
  ];

  const openCategoryForm = (category?: BackendRecord) => {
    setEditingCategory(category || null);
    setModalMode('category');
    setCategoryForm(
      category
        ? { name: category.name || '', description: category.description || '' }
        : { name: '', description: '' }
    );
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingCategory(null);
    setCategoryForm({});
    setFormError(null);
  };

  const saveCategory = async () => {
    if (!canCreate && !editingCategory) return toast.error('Permission denied');
    if (!canUpdate && editingCategory) return toast.error('Permission denied');
    if (!categoryForm.name) {
      setFormError({ name: ['Category name is required'] });
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const response = editingCategory
        ? await DesignService.updateCategory('', editingCategory.id as string, categoryForm as any)
        : await DesignService.createCategory('', categoryForm as any);

      if (response.success) {
        toast.success(`Category ${editingCategory ? 'updated' : 'created'}`);
        closeModal();
        await loadData();
      } else {
        setFormError(response.error?.details || { general: [response.error?.message || 'Failed to save'] });
      }
    } catch {
      toast.error('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = (category: BackendRecord) => {
    if (!canDelete) return toast.error('Permission denied');
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        const response = await DesignService.deleteCategory('', category.id as string);
        if (response.success) {
          toast.success('Category deleted');
          await loadData();
        } else {
          toast.error(response.error?.message || 'Failed to delete category');
        }
      },
    });
  };

  return (
    <DashboardLayout
      title="Design Categories"
      subtitle="Manage categories for your design catalogue"
      action={
        <div className="flex flex-wrap gap-2">
          {canCreate && (
            <button
              onClick={() => openCategoryForm()}
              className="inline-flex items-center gap-2 rounded-lg theme-accent-btn px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          )}
        </div>
      }
    >
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <AdvancedDataTable
          data={categories}
          loading={loading}
          searchPlaceholder="Search categories..."
          columns={[
            {
              field: 'name',
              header: 'Category Name',
              sortable: true,
              filterable: true,
              render: row => (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold theme-text-primary">{row.name}</span>
                    {row.description && (
                      <p className="mt-0.5 text-xs text-slate-500 max-w-sm truncate">{row.description}</p>
                    )}
                  </div>
                </div>
              ),
            },
            {
              field: 'productCount',
              header: 'No of Products',
              sortable: true,
              filterable: true,
              filterType: 'number',
              render: row => (
                <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200">
                  {row.productCount || 0} {(row.productCount === 1) ? 'product' : 'products'}
                </div>
              ),
            },
            {
              field: 'actions',
              header: 'Actions',
              align: 'center',
              render: row => (
                <div className="flex justify-center gap-2">
                  {canUpdate && (
                    <button
                      onClick={() => openCategoryForm(row)}
                      className="theme-secondary-btn rounded-lg p-2"
                      title="Edit Category"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => deleteCategory(row)}
                      className="theme-danger-btn rounded-lg p-2"
                      title="Delete Category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      {modalMode === 'category' && (
        <SimpleRecordModal
          title={editingCategory ? 'Edit Category' : 'Add Category'}
          subtitle="Category name must be unique"
          fields={categoryFields}
          values={categoryForm}
          saving={saving}
          apiError={formError}
          submitLabel={editingCategory ? 'Update Category' : 'Create Category'}
          onChange={(name, value) => setCategoryForm(form => ({ ...form, [name]: value }))}
          onClose={closeModal}
          onSubmit={saveCategory}
        />
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
        isDestructive={true}
      />
    </DashboardLayout>
  );
}
