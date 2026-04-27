import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: Date;
  actionUrl?: string;
}

interface AlertsWidgetProps {
  alerts: Alert[];
}

export function AlertsWidget({ alerts }: AlertsWidgetProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-[#cc2200]" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#d97706]" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-[#0284c7]" />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-[#fff0f0] border-[#cc2200]/20';
      case 'warning':
        return 'bg-[#fffbeb] border-[#d97706]/20';
      case 'info':
      default:
        return 'bg-[#e0f2fe] border-[#0284c7]/20';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-[0_2px_12px_rgba(0,0,0,0.04)] h-full flex flex-col">
      <div className="p-6 border-b border-[#e5e7eb]">
        <h3 className="text-[18px] font-bold text-[#0F2A4A]">Recent Alerts</h3>
        <p className="text-sm text-[#6b7280] mt-1">{alerts.length} active notifications</p>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#9ca3af]">
              <CheckCircle className="w-10 h-10 mb-3 text-[#e5e7eb]" />
              <span className="font-medium text-[#6b7280]">All systems operational</span>
            </div>
          ) : (
            alerts.slice(0, 5).map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border flex gap-4 items-start ${getSeverityClass(alert.severity)}`}
              >
                <div className="flex-shrink-0 mt-0.5 bg-white p-1.5 rounded-lg shadow-sm">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[15px] text-[#0F2A4A] leading-tight">{alert.title}</p>
                  <p className="text-[13px] text-[#374151] mt-1 leading-relaxed">{alert.message}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mt-2">
                    {new Date(alert.timestamp).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
