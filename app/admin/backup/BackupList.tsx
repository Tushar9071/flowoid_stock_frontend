'use client';

import React, { useEffect } from 'react';
import { useBackupList } from '@/hooks/useBackup';
import { Skeleton } from '@/components/ui/skeleton';
import { DatabaseBackup, HardDrive, CheckCircle2, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BackupListProps {
  refreshTrigger: number;
}

export function BackupList({ refreshTrigger }: BackupListProps) {
  const { backups, isLoading, error, refetch } = useBackupList();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(5);

  useEffect(() => {
    if (refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const totalPages = Math.max(1, Math.ceil(backups.length / itemsPerPage));
  const paginatedBackups = backups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center gap-2">
        <DatabaseBackup className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold text-gray-800">Backup History</h3>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full text-left border-collapse">
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-200">
              <TableHead>Filename</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : backups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-gray-500">
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
                      <span className="text-sm font-medium text-gray-900 font-mono">{backup.filename}</span>
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
                    {formatBytes(backup.sizeBytes)}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      backup.status === 'SUCCESS' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {backup.status === 'SUCCESS' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {backup.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {backups.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 px-6 py-4 gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, backups.length)} of {backups.length} backups
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
