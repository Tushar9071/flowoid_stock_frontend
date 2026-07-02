'use client';

import React, { useState } from 'react';
import { LogEntry, LogFilters } from '@/lib/api/logs';
import { LogRowDetail } from './LogRowDetail';
import { ChevronRight, ChevronDown, Download, Copy, Check, Inbox, SearchX, CheckSquare, Square } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface LogsTableProps {
  logs: LogEntry[];
  total: number;
  isLoading: boolean;
  filters: LogFilters;
  setFilters: (filters: LogFilters) => void;
  expandedRowId: string | null;
  setExpandedRowId: (id: string | null) => void;
  onExportCSV: (selectedIds: string[]) => void;
  onExportJSON: (selectedIds: string[]) => void;
}

const getLevelBadge = (level: string) => {
  const normalized = level.toUpperCase();
  switch (normalized) {
    case 'ERROR': return 'bg-red-50 text-red-700 border border-red-200';
    case 'WARN': 
    case 'WARNING': return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'INFO': return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'DEBUG': return 'bg-gray-100 text-gray-700 border border-gray-200';
    default: return 'bg-gray-50 text-gray-700 border border-gray-200';
  }
};

export const LogsTable = React.memo(function LogsTable({ 
  logs, 
  total, 
  isLoading, 
  filters, 
  setFilters, 
  expandedRowId, 
  setExpandedRowId, 
  onExportCSV,
  onExportJSON
}: LogsTableProps) {
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / filters.limit);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(logs.map(l => l.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const handleCopyMessage = (e: React.MouseEvent, id: string, message: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(message);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[600px] max-h-[70vh]">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-gray-900 text-lg">System Logs</h3>
          {selectedIds.size > 0 && (
            <span className="text-sm font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
              {selectedIds.size} selected
            </span>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2 h-9 border-gray-200 hover:bg-gray-50 font-semibold text-gray-700">
              <Download className="w-4 h-4" /> Export {selectedIds.size > 0 ? 'Selected' : 'All Loaded'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 z-50">
            <DropdownMenuItem onClick={() => onExportCSV(Array.from(selectedIds))} className="font-medium cursor-pointer">
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExportJSON(Array.from(selectedIds))} className="font-medium cursor-pointer">
              Export as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-auto relative scrollbar-thin">
        <Table className="w-full text-left border-collapse min-w-[1000px]">
          <TableHeader className="sticky top-0 bg-gray-50 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-b border-gray-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 px-4">
                <Checkbox 
                  checked={logs.length > 0 && selectedIds.size === logs.length}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  aria-label="Select all"
                  className="border-gray-300"
                />
              </TableHead>
              <TableHead className="w-10 px-2"></TableHead>
              <TableHead className="font-bold text-gray-600 uppercase text-[11px] tracking-wider w-[180px]">Timestamp</TableHead>
              <TableHead className="font-bold text-gray-600 uppercase text-[11px] tracking-wider w-[120px]">Level</TableHead>
              <TableHead className="font-bold text-gray-600 uppercase text-[11px] tracking-wider w-[140px]">Category</TableHead>
              <TableHead className="font-bold text-gray-600 uppercase text-[11px] tracking-wider">Message</TableHead>
              <TableHead className="font-bold text-gray-600 uppercase text-[11px] tracking-wider w-[160px] hidden md:table-cell">Endpoint</TableHead>
              <TableHead className="font-bold text-gray-600 uppercase text-[11px] tracking-wider w-[100px] hidden lg:table-cell">Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 15 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell className="px-4 py-3"><Skeleton className="h-4 w-4 rounded" /></TableCell>
                  <TableCell className="px-2 py-3"><Skeleton className="h-4 w-4 rounded" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-4 w-full max-w-md" /></TableCell>
                  <TableCell className="py-3 hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="py-3 hidden lg:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="h-[400px]">
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-sm">
                      {filters.search || filters.level !== 'All' ? (
                        <SearchX className="w-8 h-8 text-gray-400" />
                      ) : (
                        <Inbox className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <p className="text-base font-semibold text-gray-900 mb-1">
                      {filters.search || filters.level !== 'All' ? 'No logs match your filters' : 'No logs available'}
                    </p>
                    <p className="text-sm text-gray-500 max-w-sm text-center">
                      {filters.search || filters.level !== 'All' 
                        ? 'Try adjusting or clearing your search and filter criteria to find what you are looking for.' 
                        : 'System logs will appear here once activity occurs on the platform.'}
                    </p>
                    {(filters.search || filters.level !== 'All') && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => setFilters({ ...filters, search: '', level: 'All', category: 'All', page: 1 })}
                      >
                        Clear all filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => {
                const isExpanded = expandedRowId === log.id;
                const isSelected = selectedIds.has(log.id);
                return (
                  <React.Fragment key={log.id}>
                    <TableRow 
                      className={`cursor-pointer transition-colors group ${
                        isSelected ? 'bg-blue-50/40 hover:bg-blue-50/60' : 
                        isExpanded ? 'bg-gray-50/80 hover:bg-gray-50' : 
                        'hover:bg-gray-50'
                      }`}
                      onClick={() => setExpandedRowId(isExpanded ? null : log.id)}
                    >
                      <TableCell className="w-10 px-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectRow(log.id, checked as boolean)}
                          className={`border-gray-300 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        />
                      </TableCell>
                      <TableCell className="w-10 px-2 text-gray-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </TableCell>
                      <TableCell className="text-[13px] font-medium text-gray-600 whitespace-nowrap">
                        {(() => {
                          const dateVal = log.timestamp || (log as any).createdAt || (log as any).date;
                          if (!dateVal) return '-';
                          const d = new Date(dateVal);
                          if (isNaN(d.getTime())) return String(dateVal);
                          return d.toLocaleString([], {
                            month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
                          });
                        })()}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider shadow-sm ${getLevelBadge(log.level)}`}>
                          {log.level}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200">
                          {log.category || 'General'}
                        </span>
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-900 max-w-md">
                        <div className="flex items-center justify-between group/msg">
                          <span className="truncate font-medium pr-4">{log.message}</span>
                          <button 
                            onClick={(e) => handleCopyMessage(e, log.id, log.message)}
                            className={`p-1.5 rounded-md shrink-0 transition-opacity ${
                              copiedId === log.id ? 'opacity-100 bg-green-50 text-green-600' : 'opacity-0 group-hover/msg:opacity-100 hover:bg-gray-200 text-gray-500'
                            }`}
                            title="Copy message"
                          >
                            {copiedId === log.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-500 hidden md:table-cell font-mono max-w-[150px] truncate">
                        {log.endpoint || log.meta?.route || '-'}
                      </TableCell>
                      <TableCell className="text-[13px] font-medium text-gray-500 hidden lg:table-cell">
                        {log.duration ? `${log.duration}ms` : '-'}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                        <TableCell colSpan={8} className="p-0 border-b-2 border-gray-200">
                          <div className="px-10 py-4 shadow-inner">
                            <LogRowDetail log={log} />
                          </div>
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

      <div className="mt-auto p-4 border-t border-gray-200 bg-gray-50 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-medium text-gray-500">Rows per page:</span>
          <Select 
            value={filters.limit.toString()} 
            onValueChange={(val) => setFilters({ ...filters, limit: Number(val), page: 1 })}
          >
            <SelectTrigger className="w-[80px] h-8 text-[13px] font-medium bg-white border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="250">250</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[13px] text-gray-600 font-semibold bg-white px-3 py-1.5 rounded-md border border-gray-200">
            Page {filters.page} of {Math.max(1, totalPages)}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-[13px] font-medium border-gray-300 hover:bg-gray-100"
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page <= 1 || isLoading}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-[13px] font-medium border-gray-300 hover:bg-gray-100"
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
});
