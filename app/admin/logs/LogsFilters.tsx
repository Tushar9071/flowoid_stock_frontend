'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogFilters } from '@/lib/api/logs';
import { X, RefreshCw } from 'lucide-react';
import { SearchInput } from '@/components/shared/search-input';

interface LogsFiltersProps {
  filters: LogFilters;
  setFilters: (filters: LogFilters) => void;
  totalLogs: number;
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
  lastUpdated: Date | null;
}

export function LogsFilters({ filters, setFilters, totalLogs, autoRefresh, setAutoRefresh, lastUpdated }: LogsFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ ...filters, search: searchInput, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, filters, setFilters]);

  const handleClear = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: 50,
      level: 'All',
      category: 'All',
      search: '',
    });
  };

  const [timeAgo, setTimeAgo] = useState(0);
  useEffect(() => {
    if (!lastUpdated) return;
    const interval = setInterval(() => {
      setTimeAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4 space-y-4">
      <div className="flex flex-col md:flex-row items-center gap-3">
        <SearchInput
          containerClassName="flex-1 w-full"
          inputClassName="bg-gray-50 border-gray-200"
          placeholder="Search log messages..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={filters.level || 'All'} onValueChange={(val) => setFilters({ ...filters, level: val, page: 1 })}>
            <SelectTrigger className="w-[130px] bg-gray-50">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Levels</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
              <SelectItem value="WARN">Warn</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="DEBUG">Debug</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.category || 'All'} onValueChange={(val) => setFilters({ ...filters, category: val, page: 1 })}>
            <SelectTrigger className="w-[150px] bg-gray-50">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              <SelectItem value="http">HTTP</SelectItem>
              <SelectItem value="auth">Auth</SelectItem>
              <SelectItem value="db">Database</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="job">Jobs</SelectItem>
              <SelectItem value="db_audit">Audit</SelectItem>
              <SelectItem value="backup">Backup</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleClear} title="Clear filters" className="shrink-0 text-gray-500 hover:text-red-500">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm">
        <div className="text-gray-500 font-medium">
          Showing <span className="text-gray-900">{totalLogs.toLocaleString()}</span> logs
        </div>
        
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated {timeAgo}s ago
            </span>
          )}
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoRefresh ? 'bg-blue-600' : 'bg-gray-200'}`}>
              <input type="checkbox" className="sr-only" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${autoRefresh ? 'translate-x-4.5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 flex items-center gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin text-blue-500' : ''}`} /> Auto Refresh
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
