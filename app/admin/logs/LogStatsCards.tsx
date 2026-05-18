'use client';

import React from 'react';
import { useLogStats } from '@/hooks/useLogs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, AlertTriangle, FileText, Clock } from 'lucide-react';

export function LogStatsCards() {
  const { stats, isLoading, error } = useLogStats();

  if (error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{typeof error === 'string' ? error : JSON.stringify(error)}</div>;
  }

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-sm font-medium">Total Logs (24h)</span>
            <FileText className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.last24h.total.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <div className="flex items-center justify-between text-gray-500 mb-2 pl-2">
            <span className="text-sm font-medium">Errors (24h)</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600 pl-2">{stats.last24h.errors.toLocaleString()}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-yellow-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
          <div className="flex items-center justify-between text-gray-500 mb-2 pl-2">
            <span className="text-sm font-medium">Warnings (24h)</span>
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600 pl-2">{stats.last24h.warns.toLocaleString()}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <div className="flex items-center justify-between text-gray-500 mb-2 pl-2">
            <span className="text-sm font-medium">Errors (7 days)</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600 pl-2">{stats.last7d.errors.toLocaleString()}</p>
        </div>
      </div>

      {stats.topErrors.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" /> Top Errors
          </h3>
          <div className="space-y-2">
            {stats.topErrors.slice(0, 5).map((err, i) => (
              <div key={i} className="flex items-start justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                <span className="text-sm text-gray-800 font-mono truncate max-w-[80%]">{err.message}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  {err.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
