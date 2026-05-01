'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Plus, Edit2, Loader2, ShieldCheck, Trash2, X, Save } from 'lucide-react';
import { PermissionService } from '@/lib/services/role-permission.service';
import { Permission } from '@/lib/types';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

type PermissionForm = {
  code: string;
  name: string;
  description: string;
};

const emptyForm: PermissionForm = {
  code: '',
  name: '',
  description: '',
};

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState<PermissionForm>(emptyForm);

  const modules = useMemo(
    () => Array.from(new Set(permissions.map(p => p.module || p.code?.split('.')?.[0] || 'system'))),
    [permissions],
  );

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const res = await PermissionService.list();
      if (res.success) {
        setPermissions(res.data || []);
      } else {
        toast.error(res.error?.message || 'Failed to load permissions');
      }
    } catch (error) {
      toast.error('Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const openCreateModal = () => {
    setEditingPermission(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (permission: Permission) => {
    setEditingPermission(permission);
    setFormData({
      code: permission.code,
      name: permission.name,
      description: permission.description || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPermission(null);
    setFormData(emptyForm);
  };

  const handleSavePermission = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim()) return toast.error('Permission name is required');
    if (!editingPermission && !formData.code.trim()) return toast.error('Permission code is required');

    setIsSaving(true);
    try {
      const res = editingPermission
        ? await PermissionService.update(editingPermission.id, {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
          })
        : await PermissionService.create({
            code: formData.code.trim(),
            name: formData.name.trim(),
            description: formData.description.trim() || null,
          });

      if (res.success) {
        toast.success(editingPermission ? 'Permission updated successfully' : 'Permission created successfully');
        closeModal();
        await fetchPermissions();
      } else {
        toast.error(res.error?.message || `Failed to ${editingPermission ? 'update' : 'create'} permission`);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePermission = async (permission: Permission) => {
    const confirmed = window.confirm(`Delete permission "${permission.name}"? Roles using this permission may lose access.`);
    if (!confirmed) return;

    try {
      const res = await PermissionService.delete(permission.id);
      if (res.success) {
        toast.success('Permission deleted successfully');
        setPermissions(prev => prev.filter(p => p.id !== permission.id));
      } else {
        toast.error(res.error?.message || 'Failed to delete permission');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D7377]" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex justify-end">
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[#0D7377] hover:bg-[#0a5d60] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-teal-900/10 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Permission
        </button>
      </div>

      <div className="space-y-10">
        {modules.map(moduleName => {
          const modulePermissions = permissions.filter(p => (p.module || p.code?.split('.')?.[0] || 'system') === moduleName);
          return (
            <div key={moduleName} className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="p-1.5 bg-teal-50 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-[#0D7377]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 capitalize">{moduleName} Module</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modulePermissions.map(perm => (
                  <Card key={perm.id} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 hover:border-[#0D7377] hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-[#0D7377] transition-colors">{perm.name}</h4>
                        <code className="text-[10px] font-mono text-gray-400 mt-1 block tracking-tight">
                          {perm.code}
                        </code>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(perm)}
                          className="p-2 bg-gray-50 hover:bg-teal-50 rounded-lg transition-all"
                          title="Edit permission"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeletePermission(perm)}
                          className="p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                          title="Delete permission"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
                      {perm.description || 'No description available for this permission.'}
                    </p>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-medium">
                        Added {new Date(perm.createdAt).toLocaleDateString()}
                      </span>
                      <div className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase">
                        {perm.action || perm.code?.split('.')?.[1] || 'access'}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
        
        {permissions.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500">No permissions found in the system.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0F2A4A]/80 backdrop-blur-sm"
              onClick={closeModal}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-[#0F2A4A]">{editingPermission ? 'Edit Permission' : 'Add Permission'}</h2>
                  <p className="text-gray-500 text-sm mt-1">Define permission code, name and description</p>
                </div>
                <button onClick={closeModal} className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSavePermission}>
                <div className="p-8 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Permission Code</label>
                    <input
                      type="text"
                      value={formData.code}
                      disabled={!!editingPermission}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      placeholder="orders.create"
                      className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-[#0D7377] transition-all font-bold text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Permission Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Create Orders"
                      className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-[#0D7377] transition-all font-bold text-gray-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Allows creating new orders"
                      className="w-full h-28 p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-[#0D7377] transition-all font-medium text-gray-900 resize-none"
                    />
                  </div>
                </div>

                <div className="p-8 border-t border-gray-100 bg-gray-50 flex justify-end gap-4">
                  <button type="button" onClick={closeModal} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-8 py-3 bg-[#0D7377] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#0a5d60] shadow-lg shadow-teal-900/10 active:scale-95 transition-all disabled:opacity-70"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {editingPermission ? 'Save Changes' : 'Create Permission'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
