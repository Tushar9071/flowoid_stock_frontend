'use client';

import React, { useState } from 'react';
import { LogEntry } from '@/lib/api/logs';
import { Copy, Check, Terminal, FileJson, Clock, User, Fingerprint, Activity, MapPin, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LogRowDetail({ log }: { log: LogEntry }) {
  const [copiedJSON, setCopiedJSON] = useState(false);
  const hasMetadata = log.meta && Object.keys(log.meta).length > 0;

  const handleCopyJSON = () => {
    if (!log.meta) return;
    navigator.clipboard.writeText(JSON.stringify(log.meta, null, 2));
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2000);
  };

  // Helper to safely format dates
  const formatDetailDate = (dateVal: any) => {
    if (!dateVal) return '-';
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? String(dateVal) : d.toLocaleString([], {
      year: 'numeric', month: 'short', day: '2-digit', 
      hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3
    });
  };

  const timestamp = log.timestamp || (log as any).createdAt || (log as any).date;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-200">
        
        {/* General Details Pane */}
        <div className="p-5 bg-gray-50/50">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-gray-400" />
            General Details
          </h4>
          
          <div className="space-y-4">
            <div>
              <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Full Message</span>
              <p className="text-[13px] text-gray-900 font-medium leading-relaxed break-words bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                {log.message}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                  <Clock className="w-3.5 h-3.5" /> Timestamp
                </span>
                <p className="text-[13px] font-medium text-gray-800">{formatDetailDate(timestamp)}</p>
              </div>
              
              <div>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                  <User className="w-3.5 h-3.5" /> User / Actor
                </span>
                <p className="text-[13px] font-medium text-gray-800 truncate" title={(log as any).userName || log.userId || log.meta?.userId || 'System / Anonymous'}>
                  {(log as any).userName || log.userId || log.meta?.userId || 'System / Anonymous'}
                  {!(log as any).userName && (log.userId || log.meta?.userId) && <span className="block text-[10px] text-gray-400 mt-0.5 font-mono">{(log.userId || log.meta?.userId)}</span>}
                </p>
              </div>

              <div>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                  <Activity className="w-3.5 h-3.5" /> Action / Route
                </span>
                <p className="text-[13px] font-medium text-gray-800 font-mono truncate" title={log.endpoint || log.meta?.route || log.category}>
                  {log.endpoint || log.meta?.route || log.category}
                </p>
              </div>

              <div>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                  <Activity className="w-3.5 h-3.5" /> Duration
                </span>
                <p className="text-[13px] font-medium text-gray-800">
                  {log.duration ? `${log.duration}ms` : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details Pane */}
        <div className="p-5 bg-white">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Network className="w-4 h-4 text-gray-400" />
            Technical Details
          </h4>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                <MapPin className="w-3.5 h-3.5" /> IP Address
              </span>
              <p className="text-[13px] font-medium text-gray-800 font-mono">
                {log.ip || log.ipAddress || log.meta?.ip || 'N/A'}
              </p>
            </div>
            
            <div>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                <Fingerprint className="w-3.5 h-3.5" /> Request ID
              </span>
              <p className="text-[13px] font-medium text-gray-800 font-mono truncate" title={log.requestId || log.meta?.requestId || 'N/A'}>
                {log.requestId || log.meta?.requestId || 'N/A'}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                <FileJson className="w-3.5 h-3.5" /> Metadata JSON
              </span>
              {hasMetadata && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyJSON}
                  className="h-6 text-[11px] px-2 font-semibold bg-gray-50 hover:bg-gray-100 border-gray-200"
                >
                  {copiedJSON ? <Check className="w-3 h-3 mr-1 text-green-600" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copiedJSON ? 'Copied' : 'Copy JSON'}
                </Button>
              )}
            </div>

            {hasMetadata ? (
              <div className="relative rounded-md overflow-hidden border border-slate-700 shadow-sm bg-[#1e1e1e]">
                {/* Syntax Highlighted JSON (Simple implementation using HTML markup) */}
                <pre className="p-3 overflow-x-auto text-[12px] leading-relaxed font-mono custom-scrollbar">
                  {JSON.stringify(log.meta, null, 2).split('\n').map((line, i) => {
                    // Extremely basic regex-based syntax highlighting for JSON
                    let highlightedLine = line;
                    highlightedLine = highlightedLine.replace(/"([^"]+)":/g, '<span class="text-[#9cdcfe]">"$1"</span>:'); // Keys
                    highlightedLine = highlightedLine.replace(/: "([^"]+)"/g, ': <span class="text-[#ce9178]">"$1"</span>'); // String values
                    highlightedLine = highlightedLine.replace(/: ([0-9]+)/g, ': <span class="text-[#b5cea8]">$1</span>'); // Number values
                    highlightedLine = highlightedLine.replace(/: (true|false|null)/g, ': <span class="text-[#569cd6]">$1</span>'); // Booleans/null
                    
                    return (
                      <div key={i} className="table-row">
                        <span className="table-cell select-none text-right pr-3 text-slate-600 border-r border-slate-700/50 w-8">{i + 1}</span>
                        <span className="table-cell pl-3 whitespace-pre text-slate-300" dangerouslySetInnerHTML={{ __html: highlightedLine }} />
                      </div>
                    );
                  })}
                </pre>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-6 flex flex-col items-center justify-center text-gray-400 shadow-inner">
                <FileJson className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">No metadata available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
