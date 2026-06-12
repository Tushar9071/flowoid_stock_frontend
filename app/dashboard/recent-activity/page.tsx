'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRecentActivity } from '@/lib/hooks/use-activity-context';
import { CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function RecentActivityPage() {
  const { activities, loading } = useRecentActivity();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const perPage = 8;
  
  const filteredActivities = activities.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredActivities.length / perPage);
  const paginatedActivities = filteredActivities.slice((page - 1) * perPage, page * perPage);

  return (
    <DashboardLayout title="Recent Activity">
      <div className="space-y-6 max-w-5xl mx-auto">
        
        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col h-full min-h-[500px]">
          <div className="p-4 sm:p-6 border-b border-[#e5e7eb] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-[18px] font-bold theme-text-primary">All Recent Activity</h3>
              <p className="text-sm text-[#6b7280] mt-1">A timeline of the latest operations and updates across your organization.</p>
            </div>
            <div className="w-full sm:w-72 shrink-0 flex items-center gap-2.5 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 transition-all focus-within:bg-white focus-within:border-slate-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="pointer-events-none shrink-0 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="min-w-0 flex-1 bg-transparent text-sm text-[#0F2A4A] outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
          
          <div className="p-6 flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#9ca3af]">
                <CheckCircle className="w-12 h-12 mb-4 text-[#e5e7eb]" />
                <span className="font-medium text-[#6b7280]">No recent activity available</span>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 py-4">
                {paginatedActivities.map((activity) => (
                  <div key={activity.id} className="relative pl-8 group">
                    <span className="absolute -left-[21px] top-1 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 border-2 border-slate-200 shadow-sm group-hover:border-indigo-300 group-hover:bg-indigo-50 transition-colors">
                      <activity.icon className="h-5 w-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                    </span>
                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 group-hover:border-indigo-100 group-hover:bg-indigo-50/30 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="text-[15px] font-bold text-slate-900 leading-tight">
                          {activity.title}
                        </h4>
                        <div className="flex items-center text-[13px] font-medium text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm shrink-0">
                          <Clock className="w-3.5 h-3.5 mr-1.5" />
                          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                        </div>
                      </div>
                      <p className="text-[14px] text-slate-600 mt-2 leading-relaxed">
                        {activity.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Pagination Controls */}
          {!loading && filteredActivities.length > 0 && (
            <div className="p-4 border-t border-[#e5e7eb] flex items-center justify-between bg-slate-50/50">
              <span className="text-sm text-slate-500">
                Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, filteredActivities.length)} of {filteredActivities.length} activities
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-slate-700 px-2">
                  Page {page} of {totalPages || 1}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || totalPages === 0}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
