'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Plus, Edit2, Trash2, Loader2, Shield, 
  Check, X, Search, Info, AlertTriangle,
  ChevronRight, Save, Lock
} from 'lucide-react';
import { RoleService, PermissionService } from '@/lib/services/role-permission.service';
import { Role, Permission } from '@/lib/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    permissionIds: [] as string[]
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        RoleService.list(),
        PermissionService.list()
      ]);

      if (rolesRes.success) {
        setRoles(rolesRes.data);
        if (rolesRes.data.length > 0 && !selectedRole) {
          setSelectedRole(rolesRes.data[0]);
        }
      }
      if (permsRes.success) setPermissions(permsRes.data);
    } catch (error) {
      toast.error('Failed to load roles and permissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const handleAdminAction = () => handleCreateRole();
    window.addEventListener('admin-action-click', handleAdminAction);
    return () => window.removeEventListener('admin-action-click', handleAdminAction);
  }, []);

  const handleCreateRole = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', isActive: true, permissionIds: [] });
    setIsModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      isActive: role.isActive,
      permissionIds: role.permissions?.map(rp => rp.permission.id) || [],
    });
    setIsModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Role name is required');
    
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
        permissionIds: formData.permissionIds,
      };
      const res = editingRole
        ? await RoleService.update(editingRole.id, payload)
        : await RoleService.create(payload);
      if (res.success) {
        toast.success(editingRole ? 'Role updated successfully' : 'Role created successfully');
        setIsModalOpen(false);
        setEditingRole(null);
        setSelectedRole(res.data);
        await fetchData();
      } else {
        toast.error(res.error?.message || `Failed to ${editingRole ? 'update' : 'create'} role`);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.isSystem) return toast.error('System roles cannot be deleted');
    const confirmed = window.confirm(`Delete role "${role.name}"? This removes its role-permission mappings.`);
    if (!confirmed) return;

    try {
      const res = await RoleService.delete(role.id);
      if (res.success) {
        toast.success('Role deleted successfully');
        setRoles(prev => {
          const next = prev.filter(r => r.id !== role.id);
          setSelectedRole(next[0] || null);
          return next;
        });
      } else {
        toast.error(res.error?.message || 'Failed to delete role');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  const togglePermission = (id: string) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(id)
        ? prev.permissionIds.filter(pid => pid !== id)
        : [...prev.permissionIds, id]
    }));
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#0D7377]" />
          <p className="text-gray-500 font-medium animate-pulse">Loading Role Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black text-[#0F2A4A] tracking-tight">Role Management</h1>
          <p className="text-gray-500 text-sm mt-1">Define system access levels and permissions</p>
        </div>
        <button
          onClick={handleCreateRole}
          className="flex items-center gap-2 bg-[#0D7377] hover:bg-[#0a5d60] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-teal-900/10 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create New Role
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Roles List */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0D7377]" />
                Available Roles
              </h2>
              <span className="bg-gray-200 text-gray-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                {roles.length} Total
              </span>
            </div>
            <div className="p-3 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                {roles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`group w-full text-left p-4 rounded-xl transition-all relative overflow-hidden ${
                      selectedRole?.id === role.id
                        ? 'bg-[#0D7377] text-white shadow-md'
                        : 'bg-white hover:bg-gray-50 border border-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <h3 className="font-bold text-[15px]">{role.name}</h3>
                        <p className={`text-[11px] mt-1 font-medium ${
                          selectedRole?.id === role.id ? 'text-teal-100' : 'text-gray-500'
                        }`}>
                          {role.isSystem ? 'SYSTEM ACCESS' : 'CUSTOM ROLE'}
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${
                        selectedRole?.id === role.id ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
                      }`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Role Details */}
        <div className="lg:col-span-8 space-y-6">
          {selectedRole ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedRole.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                {/* Detailed Info Card */}
                <Card className="rounded-2xl border-none shadow-sm bg-white p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-black text-[#0F2A4A]">{selectedRole.name}</h2>
                        {selectedRole.isSystem && (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full">
                            <Lock className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">System</span>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-500 leading-relaxed text-[15px]">
                        {selectedRole.description || 'No description provided for this role.'}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {!selectedRole.isSystem && (
                        <>
                          <button
                            onClick={() => handleEditRole(selectedRole)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRole(selectedRole)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-colors border border-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-8 mt-8 border-t border-gray-50">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Current Status</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${selectedRole.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-300'}`} />
                        <span className={`font-bold text-sm ${selectedRole.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                          {selectedRole.isActive ? 'Active Session' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Scope</span>
                      <span className="text-sm font-bold text-[#0F2A4A]">Organization Wide</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Assigned Permissions</span>
                      <span className="text-2xl font-black text-[#0D7377]">{selectedRole.permissions?.length || 0}</span>
                    </div>
                  </div>
                </Card>

                {/* Permissions Grid View */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#0F2A4A] flex items-center gap-2">
                      Detailed Permissions Matrix
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </h3>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {selectedRole.permissions?.map(rp => (
                      <Card key={rp.id} className="p-5 border-none shadow-sm bg-white hover:shadow-md transition-shadow group">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-900 group-hover:text-[#0D7377] transition-colors">
                                {rp.permission.name}
                              </span>
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-black rounded uppercase">
                                {rp.permission.module}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              {rp.permission.description}
                            </p>
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                            <Check className="w-4 h-4 text-teal-600" />
                          </div>
                        </div>
                      </Card>
                    ))}
                    {(!selectedRole.permissions || selectedRole.permissions.length === 0) && (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <AlertTriangle className="w-10 h-10 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium text-center">
                          No specific permissions assigned.<br />
                          <span className="text-xs">Click Edit to configure access for this role.</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                <Shield className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Role Selected</h3>
              <p className="text-gray-500 text-center max-w-sm">
                Choose a role from the left panel to view its full configuration and assigned permissions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE ROLE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0F2A4A]/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-[#0F2A4A]">{editingRole ? 'Edit Role' : 'Create New Role'}</h2>
                  <p className="text-gray-500 text-sm mt-1">Configure name, description and permissions</p>
                </div>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingRole(null);
                  }}
                  className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <form className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Role Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          placeholder="e.g. Sales Manager"
                          className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-[#0D7377] transition-all font-bold text-gray-900"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Description</label>
                        <textarea
                          value={formData.description}
                          onChange={e => setFormData({...formData, description: e.target.value})}
                          placeholder="What can this role do?"
                          className="w-full h-24 p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-[#0D7377] transition-all font-medium text-gray-900 resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-teal-50/50 rounded-2xl border border-teal-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="font-bold text-sm text-[#0D7377]">Active Status</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                          className={`w-12 h-6 rounded-full transition-all relative ${formData.isActive ? 'bg-[#0D7377]' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isActive ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Assign Permissions</label>
                      <div className="h-[280px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {permissions.map(perm => (
                          <div 
                            key={perm.id}
                            onClick={() => togglePermission(perm.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              formData.permissionIds.includes(perm.id)
                                ? 'bg-teal-50 border-teal-200'
                                : 'bg-white border-gray-100 hover:border-teal-200'
                            }`}
                          >
                            <div className="flex-1 pr-2">
                              <p className="text-xs font-bold text-gray-900">{perm.name}</p>
                              <p className="text-[10px] text-gray-500">{perm.module}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                              formData.permissionIds.includes(perm.id)
                                ? 'bg-[#0D7377] text-white'
                                : 'bg-gray-100 text-transparent'
                            }`}>
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-gray-100 bg-gray-50 flex justify-end gap-4">
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingRole(null);
                  }}
                  className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveRole}
                  disabled={isSaving}
                  className="px-8 py-3 bg-[#0D7377] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#0a5d60] shadow-lg shadow-teal-900/10 active:scale-95 transition-all disabled:opacity-70"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {editingRole ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
