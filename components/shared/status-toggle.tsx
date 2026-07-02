'use client';

import React, { useState, useEffect } from 'react';
import { statusColors } from '@/lib/constants';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { confirmAction } from '@/components/shared/confirm-action';

interface StatusToggleProps {
  status: string;
  id: string;
  onStatusChange: (id: string, newStatus: string) => Promise<void>;
}

export function StatusToggle({ status: initialStatus, id, onStatusChange }: StatusToggleProps) {
  const [loading, setLoading] = useState(false);
  // Keep local state for the status to show instant update on success
  const normalizeStatus = (s: string) => {
    if (s === 'true') return 'active';
    if (s === 'false') return 'inactive';
    return s?.toLowerCase() || 'inactive';
  };
  
  const [currentStatus, setCurrentStatus] = useState(() => normalizeStatus(initialStatus));

  // Sync with prop if it changes externally
  useEffect(() => {
    setCurrentStatus(normalizeStatus(initialStatus));
  }, [initialStatus]);

  const isActive = currentStatus === 'active';
  const colors = isActive ? statusColors.active : statusColors.inactive;
  
  // Format the display string
  const displayStatus = isActive ? 'Active' : 'Inactive';

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;
    
    const confirmed = await confirmAction(
      isActive 
        ? "Are you sure you want to deactivate this item?" 
        : "Are you sure you want to activate this item?",
      {
        type: 'warning',
        title: isActive ? "Deactivate Item?" : "Activate Item?",
        description: isActive
          ? "Once deactivated, it will no longer be available until activated again."
          : "The item will become available immediately.",
        confirmText: isActive ? "Deactivate" : "Activate"
      }
    );

    if (!confirmed) return;

    setLoading(true);
    const newStatus = isActive ? 'INACTIVE' : 'ACTIVE';
    try {
      await onStatusChange(id, newStatus);
      // Wait for success, then update local state
      setCurrentStatus(newStatus.toLowerCase());
      toast.success(`Item ${isActive ? 'deactivated' : 'activated'} successfully.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border border-transparent transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${colors.bg} ${colors.text} hover:opacity-80 focus:outline-none`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
      )}
      {displayStatus}
    </button>
  );
}
