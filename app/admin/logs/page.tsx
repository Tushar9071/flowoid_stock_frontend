'use client';

import React, { useState } from 'react';
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

  const { logs, total, isLoading, refetch } = useLogs(filters, autoRefresh, expandedRowId !== null);

  const handleExport = () => {
    try {
      if (logs.length === 0) {
        toast.error('No logs to export');
        return;
      }
      
      const headers = ['Timestamp', 'Level', 'Category', 'Message', 'Endpoint', 'Duration', 'IP', 'User ID'];
      const csvContent = [
        headers.join(','),
        ...logs.map(log => [
          `"${log.timestamp || (log as any).createdAt || (log as any).date || ''}"`,
          `"${log.level}"`,
          `"${log.category}"`,
          `"${log.message.replace(/"/g, '""')}"`,
          `"${log.endpoint || ''}"`,
          `"${log.duration || ''}"`,
          `"${log.ip || ''}"`,
          `"${log.userId || ''}"`
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
      
      toast.success('Logs exported successfully');
    } catch (err) {
      toast.error('Failed to export logs');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto flex flex-col h-full pb-20">
      <LogStatsCards />
      <LogsFilters 
        filters={filters} 
        setFilters={setFilters} 
        totalLogs={total} 
        autoRefresh={autoRefresh} 
        setAutoRefresh={setAutoRefresh}
        lastUpdated={new Date()}
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
          onExport={handleExport}
        />
      </div>
    </div>
  );
}
