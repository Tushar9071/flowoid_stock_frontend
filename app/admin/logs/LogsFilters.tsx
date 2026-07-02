'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogFilters } from '@/lib/api/logs';
import { X, RefreshCw, Filter, Pause, Play } from 'lucide-react';
import { SearchInput } from '@/components/shared/search-input';
import { Badge } from '@/components/ui/badge';

interface LogsFiltersProps {
  filters: LogFilters;
  setFilters: (filters: LogFilters) => void;
  totalLogs: number;
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
  lastUpdated: Date | null;
  onRefreshNow: () => void;
  isLoading: boolean;
}

function DebouncedSearch({ 
  value, 
  onChange, 
  placeholder 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  placeholder: string;
}) {
  const [localValue, setLocalValue] = useState(value);

  // Sync local state if parent value changes from outside (e.g., clear filters)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [localValue, value, onChange]);

  return (
      <SearchInput
      containerClassName="flex-1 w-full"
      inputClassName="bg-gray-50 border-gray-200 h-10 text-[14px]"
      placeholder={placeholder}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
    />
  );
}

function RefreshControls({ 
  lastUpdated, 
  autoRefresh, 
  setAutoRefresh, 
  onRefreshNow, 
  isLoading 
}: {
  lastUpdated: Date | null;
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
  onRefreshNow: () => void;
  isLoading: boolean;
}) {
  const [timeAgo, setTimeAgo] = useState(0);
  const [localCountdown, setLocalCountdown] = useState(10);

  useEffect(() => {
    if (!lastUpdated) return;

    setLocalCountdown(10);
    setTimeAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));

    const interval = setInterval(() => {
      setTimeAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
      if (autoRefresh) {
        setLocalCountdown((prev) => (prev <= 1 ? 10 : prev - 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated, autoRefresh]);

  return (
    <div className="flex flex-wrap items-center gap-4 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
      {lastUpdated && (
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Last Updated</span>
          <span className="text-xs font-medium text-gray-700">{timeAgo}s ago</span>
        </div>
      )}
      
      <div className="w-px h-6 bg-gray-200 hidden sm:block" />

      <div className="flex items-center gap-3">
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold transition-colors ${
            autoRefresh ? 'text-blue-700 bg-blue-100 hover:bg-blue-200' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          {autoRefresh ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {autoRefresh ? 'PAUSE REFRESH' : 'RESUME REFRESH'}
        </button>

        {autoRefresh && (
          <span className="text-xs font-mono font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 min-w-[50px] text-center">
            {localCountdown}s
          </span>
        )}
        
        <Button 
          variant="default" 
          size="sm" 
          onClick={onRefreshNow} 
          disabled={isLoading}
          className="h-7 text-xs bg-gray-900 hover:bg-gray-800"
        >
          <RefreshCw className={`w-3 h-3 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Now
        </Button>
      </div>
    </div>
  );
}

export function LogsFilters({ 
  filters, 
  setFilters, 
  totalLogs, 
  autoRefresh, 
  setAutoRefresh, 
  lastUpdated,
  onRefreshNow,
  isLoading
}: LogsFiltersProps) {
  const handleClear = () => {
    setFilters({
      page: 1,
      limit: 50,
      level: 'All',
      category: 'All',
      search: '',
    });
  };

  const hasActiveFilters = filters.search || (filters.level && filters.level !== 'All') || (filters.category && filters.category !== 'All');

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-4 space-y-4">
      {/* Top Row: Search and Selects */}
      <div className="flex flex-col lg:flex-row items-center gap-4">
        <DebouncedSearch
          placeholder="Search log messages, traces, actions..."
          value={filters.search || ''}
          onChange={(val) => setFilters({ ...filters, search: val, page: 1 })}
        />
        
        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full lg:w-auto">
          <Select value={filters.level || 'All'} onValueChange={(val) => setFilters({ ...filters, level: val, page: 1 })}>
            <SelectTrigger className="w-full md:w-[140px] bg-gray-50 h-10 text-[13px] font-medium border-gray-200">
              <SelectValue placeholder="Severity Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Levels</SelectItem>
              <SelectItem value="ERROR">Errors Only</SelectItem>
              <SelectItem value="WARN">Warnings Only</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="DEBUG">Debug</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.category || 'All'} onValueChange={(val) => setFilters({ ...filters, category: val, page: 1 })}>
            <SelectTrigger className="w-full md:w-[160px] bg-gray-50 h-10 text-[13px] font-medium border-gray-200">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              <SelectItem value="http">HTTP Traffic</SelectItem>
              <SelectItem value="auth">Authentication</SelectItem>
              <SelectItem value="db">Database Queries</SelectItem>
              <SelectItem value="system">System Core</SelectItem>
              <SelectItem value="job">Background Jobs</SelectItem>
              <SelectItem value="db_audit">DB Audits</SelectItem>
              <SelectItem value="backup">Backups</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button 
              variant="outline" 
              onClick={handleClear} 
              className="shrink-0 text-gray-500 hover:text-red-600 hover:bg-red-50 border-gray-200 h-10 px-4"
            >
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Active Filter Chips (If any filters are applied) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center mr-2">
            <Filter className="w-3.5 h-3.5 mr-1" /> Active Filters:
          </span>
          {filters.search && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 flex items-center gap-1.5 px-2.5 py-1">
              Search: "{filters.search}"
              <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, search: '', page: 1 })} />
            </Badge>
          )}
          {filters.level && filters.level !== 'All' && (
            <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200 flex items-center gap-1.5 px-2.5 py-1">
              Level: {filters.level}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, level: 'All', page: 1 })} />
            </Badge>
          )}
          {filters.category && filters.category !== 'All' && (
            <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 flex items-center gap-1.5 px-2.5 py-1">
              Category: {filters.category}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, category: 'All', page: 1 })} />
            </Badge>
          )}
        </div>
      )}

      {/* Bottom Bar: Stats and Auto-Refresh */}
      <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-100 text-sm gap-4">
        <div className="text-gray-500 font-medium flex items-center gap-2">
          {isLoading ? (
            <span className="flex items-center gap-2 text-blue-600">
              <RefreshCw className="w-4 h-4 animate-spin" /> Fetching logs...
            </span>
          ) : (
            <>
              Showing <span className="text-gray-900 font-bold bg-gray-100 px-2 py-0.5 rounded-full">{totalLogs.toLocaleString()}</span> logs matching criteria
            </>
          )}
        </div>
        
        <RefreshControls 
          lastUpdated={lastUpdated} 
          autoRefresh={autoRefresh} 
          setAutoRefresh={setAutoRefresh} 
          onRefreshNow={onRefreshNow} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
}
