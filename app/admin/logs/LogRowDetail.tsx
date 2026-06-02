'use client';

import React from 'react';
import { LogEntry } from '@/lib/api/logs';

export function LogRowDetail({ log }: { log: LogEntry }) {
  return (
    <div className="p-4 bg-gray-50 border-b border-gray-200 text-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
        <div>
          <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Message</span>
          <p className="text-gray-900 break-words">{log.message}</p>
        </div>
        <div>
          <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Request Details</span>
          <div className="space-y-1 text-gray-700">
            {log.requestId && <div><span className="font-medium">Request ID:</span> <span className="font-mono text-xs">{log.requestId}</span></div>}
            {log.ip && <div><span className="font-medium">IP:</span> {log.ip}</div>}
            {log.statusCode && <div><span className="font-medium">Status Code:</span> {log.statusCode}</div>}
            {log.endpoint && <div><span className="font-medium">Endpoint:</span> <span className="font-mono text-xs">{log.endpoint}</span></div>}
          </div>
        </div>
        <div>
          <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Context</span>
          <div className="space-y-1 text-gray-700">
            <div><span className="font-medium">Category:</span> {log.category}</div>
            <div><span className="font-medium">Level:</span> {log.level}</div>
            {log.userId && <div><span className="font-medium">User ID:</span> <span className="font-mono text-xs">{log.userId}</span></div>}
            {log.duration && <div><span className="font-medium">Duration:</span> {log.duration}ms</div>}
          </div>
        </div>
      </div>
      
      {log.meta && Object.keys(log.meta).length > 0 && (
        <div>
          <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Metadata</span>
          <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-xs font-mono">
            {JSON.stringify(log.meta, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
