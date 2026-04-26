import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import Link from 'next/link';

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
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Alerts</CardTitle>
        <p className="text-sm text-muted-foreground">{alerts.length} active notifications</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>All systems operational</span>
            </div>
          ) : (
            alerts.slice(0, 5).map(alert => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border flex gap-3 ${getSeverityClass(alert.severity)}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-text">{alert.title}</p>
                  <p className="text-xs text-muted mt-0.5">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
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
      </CardContent>
    </Card>
  );
}
