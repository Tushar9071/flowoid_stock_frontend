'use client';

import React, { useState } from 'react';
import { LogEntry, LogFilters } from '@/lib/api/logs';
import { LogRowDetail } from './LogRowDetail';
import { ChevronRight, ChevronDown, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface LogsTableProps {
  logs: LogEntry[];
  total: number;
  isLoading: boolean;
  filters: LogFilters;
  setFilters: (filters: LogFilters) => void;
  expandedRowId: string | null;
  setExpandedRowId: (id: string | null) => void;
  onExport: () => void;
}

const getLevelBadge = (level: string) => {
  const normalized = level.toUpperCase();
  switch (normalized) {
    case 'ERROR': return 'bg-red-100 text-red-700 border border-red-200';
    case 'WARN': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'INFO': return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'DEBUG': return 'bg-gray-100 text-gray-700 border border-gray-200';
    default: return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
};

export function LogsTable({ logs, total, isLoading, filters, setFilters, expandedRowId, setExpandedRowId, onExport }: LogsTableProps) {
  const totalPages = Math.ceil(total / filters.limit);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Log Entries</h3>
        <Button variant="outline" size="sm" onClick={onExport} className="flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full text-left border-collapse">
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-200">
              <TableHead className="w-10"></TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="hidden md:table-cell">Endpoint</TableHead>
              <TableHead className="hidden lg:table-cell">Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                  No logs found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => {
                const isExpanded = expandedRowId === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <TableRow 
                      className={`cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}
                      onClick={() => setExpandedRowId(isExpanded ? null : log.id)}
                    >
                      <TableCell className="text-gray-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {(() => {
                          const dateVal = log.timestamp || (log as any).createdAt || (log as any).date;
                          if (!dateVal) return '-';
                          const d = new Date(dateVal);
                          if (isNaN(d.getTime())) return String(dateVal);
                          return d.toLocaleString([], {
                            year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
                          });
                        })()}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${getLevelBadge(log.level)}`}>
                          {log.level}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs border border-gray-200">
                          {log.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-900 max-w-md truncate">
                        {log.message}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 hidden md:table-cell font-mono text-xs max-w-[150px] truncate">
                        {log.endpoint || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-400 hidden lg:table-cell">
                        {log.duration ? `${log.duration}ms` : '-'}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0 border-b">
                          <LogRowDetail log={log} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-auto p-4 border-t border-gray-200 bg-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Rows per page:</span>
          <Select 
            value={filters.limit.toString()} 
            onValueChange={(val) => setFilters({ ...filters, limit: Number(val), page: 1 })}
          >
            <SelectTrigger className="w-[80px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 font-medium">
            Page {filters.page} of {Math.max(1, totalPages)}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page <= 1 || isLoading}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={filters.page >= totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
