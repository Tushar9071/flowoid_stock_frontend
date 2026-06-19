'use client';

import React from 'react';
import { useLogStats } from '@/hooks/useLogs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, AlertTriangle, FileText, User, Activity, SearchX, ActivityIcon } from 'lucide-react';

interface LogStatsCardsProps {
  analytics: {
    errorPercentage: number;
    warningPercentage: number;
    mostCommonRoute: { name: string; count: number } | null;
    mostActiveUser: { id: string; name: string; count: number } | null;
    totalLoaded: number;
  } | null;
}

export function LogStatsCards({ analytics }: LogStatsCardsProps) {
  const { stats, isLoading, error } = useLogStats();

  if (error) {
    return (
      <div className="p-4 bg-red-50/50 border border-red-200 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm mb-6">
        <AlertCircle className="w-5 h-5 text-red-500" />
        {typeof error === 'string' ? error : JSON.stringify(error)}
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 rounded-xl border border-gray-100 shadow-sm" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-xl border border-gray-100 shadow-sm" />
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-4">
      {/* Primary Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Logs Card */}
        <div className="group bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <FileText className="w-16 h-16" />
          </div>
          <div className="flex items-center justify-between text-gray-500 mb-2 relative z-10">
            <span className="text-sm font-bold uppercase tracking-wider text-gray-500">Total Logs (24h)</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 relative z-10">{stats.last24h.total.toLocaleString()}</p>
        </div>
        
        {/* Errors 24h Card */}
        <div className="group bg-white p-5 rounded-xl border border-red-100 shadow-sm hover:shadow-md hover:border-red-200 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <AlertCircle className="w-16 h-16" />
          </div>
          <div className="flex items-center justify-between text-gray-500 mb-2 pl-2 relative z-10">
            <span className="text-sm font-bold uppercase tracking-wider text-red-600">Errors (24h)</span>
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-red-600 pl-2 relative z-10">{stats.last24h.errors.toLocaleString()}</p>
        </div>

        {/* Warnings 24h Card */}
        <div className="group bg-white p-5 rounded-xl border border-amber-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <AlertTriangle className="w-16 h-16" />
          </div>
          <div className="flex items-center justify-between text-gray-500 mb-2 pl-2 relative z-10">
            <span className="text-sm font-bold uppercase tracking-wider text-amber-600">Warnings (24h)</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600 pl-2 relative z-10">{stats.last24h.warns.toLocaleString()}</p>
        </div>

        {/* Errors 7d Card */}
        <div className="group bg-white p-5 rounded-xl border border-red-100 shadow-sm hover:shadow-md hover:border-red-200 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#8b0000]" />
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <AlertCircle className="w-16 h-16" />
          </div>
          <div className="flex items-center justify-between text-gray-500 mb-2 pl-2 relative z-10">
            <span className="text-sm font-bold uppercase tracking-wider text-[#8b0000]">Errors (7 days)</span>
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-[#8b0000]" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#8b0000] pl-2 relative z-10">{stats.last7d.errors.toLocaleString()}</p>
        </div>
      </div>

      {/* Frontend Analytics Row (Only shown if data exists in the current view) */}
      {analytics && analytics.totalLoaded > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#f8fafc] border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">View Error Rate</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-gray-900">{analytics.errorPercentage}%</span>
                <span className="text-xs font-medium text-gray-500">of loaded logs</span>
              </div>
            </div>
          </div>

          <div className="bg-[#f8fafc] border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
              <ActivityIcon className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Most Active Route</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 truncate">
                  {analytics.mostCommonRoute ? analytics.mostCommonRoute.name : 'N/A'}
                </span>
                {analytics.mostCommonRoute && (
                  <span className="text-xs font-medium bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {analytics.mostCommonRoute.count}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#f8fafc] border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
              <User className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Most Active User</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 truncate">
                  {analytics.mostActiveUser ? (analytics.mostActiveUser.name === 'Anonymous' ? 'Anonymous' : analytics.mostActiveUser.name) : 'N/A'}
                </span>
                {analytics.mostActiveUser && (
                  <span className="text-xs font-medium bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {analytics.mostActiveUser.count}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Errors Row */}
      {stats.topErrors.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-red-500" /> Top Error Signatures
            </h3>
            <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Last 24h</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stats.topErrors.slice(0, 4).map((err, i) => (
              <div key={i} className="flex items-start justify-between bg-[#fff5f5] p-3 rounded-xl border border-red-100 group">
                <span className="text-[13px] text-red-900 font-mono truncate max-w-[85%] font-medium leading-relaxed group-hover:text-red-700 transition-colors">
                  {err.message || 'Unknown Error'}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-200 text-red-800 shadow-sm">
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
