'use client';

import React from 'react';
import { useBackupStatus } from '@/hooks/useBackup';
import { TriggerBackupButton } from './TriggerBackupButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Calendar, Database, CheckCircle2, XCircle } from 'lucide-react';

interface BackupStatusProps {
  onBackupTriggered: () => void;
}

export function BackupStatus({ onBackupTriggered }: BackupStatusProps) {
  const { status, isLoading, error, refetch } = useBackupStatus();

  const handleSuccess = () => {
    onBackupTriggered();
    refetch();
  };

  if (error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm mb-6">{typeof error === 'string' ? error : JSON.stringify(error)}</div>;
  }

  if (isLoading || !status) {
    return <Skeleton className="h-40 w-full mb-6 rounded-xl" />;
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 w-full">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Last Backup</p>
            <p className="font-semibold text-gray-900">
              {(() => {
                const dateVal = status.lastBackupDate || (status as any).lastBackupTimestamp;
                if (!dateVal) return 'Never';
                const d = new Date(dateVal);
                if (isNaN(d.getTime())) return String(dateVal);
                return d.toLocaleString();
              })()}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Next Scheduled</p>
            <p className="font-semibold text-gray-900">
              {(() => {
                const dateVal = status.nextScheduledDate || (status as any).nextScheduledTimestamp;
                if (!dateVal) return 'Not scheduled';
                const d = new Date(dateVal);
                if (isNaN(d.getTime())) return String(dateVal);
                return d.toLocaleString();
              })()}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Last Status</p>
            <div className="flex items-center gap-2">
              {status.lastBackupStatus === 'SUCCESS' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="font-semibold text-green-600">SUCCESS</span>
                </>
              ) : status.lastBackupStatus === 'FAILED' ? (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="font-semibold text-red-600">FAILED</span>
                </>
              ) : (
                <span className="font-semibold text-gray-500">UNKNOWN</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 w-full md:w-auto">
        <TriggerBackupButton onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
