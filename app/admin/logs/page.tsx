'use client';

import React, { useState, useEffect } from 'react';
import { LogStatsCards } from './LogStatsCards';
import { LogsFilters } from './LogsFilters';
import { LogsTable } from './LogsTable';
import { useLogs } from '@/hooks/useLogs';
import { LogFilters as FiltersType } from '@/lib/api/logs';
import { toast } from 'react-hot-toast';

export default function LogsPage() {
  const [filters, setFilters] = useState<FiltersType>({
    page: 1,
    limit: 50,
    level: 'All',
    category: 'All',
    search: '',
  });
  
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { logs, total, isLoading, refetch, analytics, refreshCountdown } = useLogs(filters, autoRefresh, expandedRowId !== null);

  useEffect(() => {
    if (!isLoading) {
      setLastUpdated(new Date());
    }
  }, [isLoading, logs]);

  const handleExportCSV = (selectedIds: string[]) => {
    try {
      const logsToExport = selectedIds.length > 0 
        ? logs.filter(l => selectedIds.includes(l.id))
        : logs;

      if (logsToExport.length === 0) {
        toast.error('No logs to export');
        return;
      }
      
      const headers = ['Timestamp', 'Level', 'Category', 'Message', 'Endpoint', 'Duration', 'IP', 'User ID'];
      const csvContent = [
        headers.join(','),
        ...logsToExport.map(log => [
          `"${log.timestamp || (log as any).createdAt || (log as any).date || ''}"`,
          `"${log.level}"`,
          `"${log.category}"`,
          `"${log.message.replace(/"/g, '""')}"`,
          `"${log.endpoint || log.meta?.route || ''}"`,
          `"${log.duration || ''}"`,
          `"${log.ip || log.ipAddress || ''}"`,
          `"${log.userId || log.meta?.userId || ''}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `system_logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${logsToExport.length} logs to CSV successfully`);
    } catch (err) {
      toast.error('Failed to export logs to CSV');
    }
  };

  const handleExportJSON = (selectedIds: string[]) => {
    try {
      const logsToExport = selectedIds.length > 0 
        ? logs.filter(l => selectedIds.includes(l.id))
        : logs;

      if (logsToExport.length === 0) {
        toast.error('No logs to export');
        return;
      }
      const jsonContent = JSON.stringify(logsToExport, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `system_logs_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${logsToExport.length} logs to JSON successfully`);
    } catch (err) {
      toast.error('Failed to export logs to JSON');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto flex flex-col min-h-full pb-20">
      <LogStatsCards analytics={analytics} />
      
      <LogsFilters 
        filters={filters} 
        setFilters={setFilters} 
        totalLogs={total} 
        autoRefresh={autoRefresh} 
        setAutoRefresh={setAutoRefresh}
        lastUpdated={lastUpdated}
        refreshCountdown={refreshCountdown}
        onRefreshNow={refetch}
        isLoading={isLoading}
      />
      
      <div className="flex-1 mt-2 min-h-[500px]">
        <LogsTable 
          logs={logs}
          total={total}
          isLoading={isLoading}
          filters={filters}
          setFilters={setFilters}
          expandedRowId={expandedRowId}
          setExpandedRowId={setExpandedRowId}
          onExportCSV={handleExportCSV}
          onExportJSON={handleExportJSON}
        />
      </div>
    </div>
  );
}
