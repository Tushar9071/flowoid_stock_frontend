'use client';

import React from 'react';
import { Activity } from '@/lib/hooks/use-activity-context';
import { CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { useRouter } from 'next/navigation';

interface RecentActivityWidgetProps {
  activities: Activity[];
  loading: boolean;
}

export function RecentActivityWidget({ activities, loading }: RecentActivityWidgetProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-[0_2px_12px_rgba(0,0,0,0.04)] h-full flex flex-col">
        <div className="p-6 border-b border-[#e5e7eb]">
          <h3 className="text-[18px] font-bold theme-text-primary">Recent Activity</h3>
        </div>
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-[0_2px_12px_rgba(0,0,0,0.04)] h-full flex flex-col">
      <div className="p-6 border-b border-[#e5e7eb] flex items-center justify-between">
        <div>
          <h3 className="text-[18px] font-bold theme-text-primary">Recent Activity</h3>
          <p className="text-sm text-[#6b7280] mt-1">Latest operations and updates</p>
        </div>
        <button 
          onClick={() => router.push('/dashboard/recent-activity')} 
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-2"
        >
          View All
        </button>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#9ca3af]">
              <CheckCircle className="w-10 h-10 mb-3 text-[#e5e7eb]" />
              <span className="font-medium text-[#6b7280]">No recent activity available</span>
            </div>
          ) : (
            <div className="relative border-l border-slate-200 ml-3 space-y-6">
              {activities.slice(0, 10).map((activity, index) => (
                <div key={activity.id} className="relative pl-6 group">
                  <span className="absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 border border-slate-200 shadow-sm group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-colors">
                    <activity.icon className="h-4 w-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                  </span>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <h4 className="text-[14px] font-bold text-slate-900 leading-tight">
                        {activity.title}
                      </h4>
                      <div className="flex items-center text-[12px] font-medium text-slate-500 shrink-0">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </div>
                    </div>
                    <p className="text-[13px] text-slate-600 mt-1 leading-relaxed">
                      {activity.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
