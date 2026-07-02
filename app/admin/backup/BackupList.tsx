'use client';

import React, { useEffect } from 'react';
import { useBackupList } from '@/hooks/useBackup';
import { Skeleton } from '@/components/ui/skeleton';
import { confirmAction } from '@/components/shared/confirm-action';
import { backupApi } from '@/lib/api/backup';
import { DatabaseBackup, HardDrive, CheckCircle2, XCircle, Download, Trash2, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import toast from 'react-hot-toast';


interface BackupListProps {
  refreshTrigger: number;
}

export function BackupList({ refreshTrigger }: BackupListProps) {
  const { backups, isLoading, error, refetch } = useBackupList();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(5);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const filteredBackups = React.useMemo(() => {
    if (statusFilter.length === 0) return backups;
    return backups.filter(b => statusFilter.includes(b.status));
  }, [backups, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBackups.length / itemsPerPage));
  const paginatedBackups = filteredBackups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{typeof error === 'string' ? error : JSON.stringify(error)}</div>;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  const deleteBackup = async (backupId?: string) => {
    if (!backupId) return toast.error('Backup id missing');
    if (!(await confirmAction('Are you sure you want to delete this backup record and file?'))) return;

    setDeletingId(backupId);
    const response = await backupApi.deleteBackup(backupId);
    if (response.success) {
      toast.success('Backup deleted');
      await refetch();
    } else {
      toast.error(response.error?.message || 'Failed to delete backup');
    }
    setDeletingId(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center gap-2">
        <DatabaseBackup className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold text-gray-800">Backup History</h3>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full text-left border-collapse min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-200">
              <TableHead>Filename</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Size</TableHead>
              <TableHead
                filterOptions={[
                  { label: 'SUCCESS', value: 'SUCCESS' },
                  { label: 'FAILED', value: 'FAILED' },
                  { label: 'PENDING', value: 'PENDING' }
                ]}
                filterValues={statusFilter}
                onFilterChange={setStatusFilter}
              >
                Status
              </TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredBackups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <DatabaseBackup className="w-10 h-10 text-gray-300" />
                    <p>No backups found. Trigger your first backup above.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedBackups.map((backup, i) => (
                <TableRow key={i} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <HardDrive className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 font-mono">{backup.filename || backup.fileName || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {(() => {
                      const dateVal = backup.date || (backup as any).createdAt || (backup as any).timestamp;
                      if (!dateVal) return '-';
                      const d = new Date(dateVal);
                      if (isNaN(d.getTime())) return String(dateVal);
                      return d.toLocaleString([], {
                        year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
                      });
                    })()}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatBytes(backup.sizeBytes || 0)}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      backup.status === 'SUCCESS' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {backup.status === 'SUCCESS' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {backup.status}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate text-sm text-gray-500" title={backup.notes || ''}>
                    {backup.notes || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {backup.id && backup.status === 'SUCCESS' && (
                        <a
                          href={backupApi.downloadUrl(backup.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                          title="Download backup"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteBackup(backup.id)}
                        disabled={!backup.id || deletingId === backup.id}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        title="Delete backup"
                      >
                        {deletingId === backup.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredBackups.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 px-6 py-4 gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredBackups.length)} of {filteredBackups.length} backups
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Rows:</span>
              <select
                value={itemsPerPage}
                onChange={e => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-sm font-semibold text-gray-700 outline-none transition"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
