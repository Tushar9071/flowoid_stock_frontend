'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { mockAuditLogs } from '@/lib/data';
import { CheckCircle2, XCircle, Filter } from 'lucide-react';

export default function AuditLogsPage() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? mockAuditLogs : mockAuditLogs.filter(l => l.status === filter);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Card className="rounded-lg border border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-3">
          <Filter className="w-5 h-5 text-gray-600" />
          {['all', 'success', 'failure'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === status
                  ? 'theme-tab-active'
                  : 'theme-tab-inactive'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="divide-y divide-gray-200">
          {filtered.map(log => (
            <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {log.status === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-gray-900">{log.userName}</span>
                    <span className="text-gray-600">{log.action}</span>
                    <span className="text-gray-600">{log.resource}</span>
                    {log.resourceName && <span className="font-medium theme-text-accent">{log.resourceName}</span>}
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      <span className="font-medium">{log.userRole}</span>
                    </span>
                    <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {log.changes && log.changes.length > 0 && (
                    <div className="mt-3 bg-gray-50 rounded p-3 text-xs">
                      {log.changes.map((change, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="font-medium text-gray-700">{change.field}:</span>
                          <span className="text-red-600 line-through">{String(change.oldValue)}</span>
                          <span>→</span>
                          <span className="text-green-600">{String(change.newValue)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    log.status === 'success'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {log.status === 'success' ? 'Success' : 'Failed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
