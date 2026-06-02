'use client';

import React from 'react';
import { useBackupStatus } from '@/hooks/useBackup';
import { TriggerBackupButton } from './TriggerBackupButton';
import { Skeleton } from '@/components/ui/skeleton';
import { backupApi } from '@/lib/api/backup';
import { Clock, Calendar, Database, CheckCircle2, XCircle, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface BackupStatusProps {
  onBackupTriggered: () => void;
}

export function BackupStatus({ onBackupTriggered }: BackupStatusProps) {
  const { status, isLoading, error, refetch } = useBackupStatus();
  const [cron, setCron] = React.useState('');
  const [isSavingCron, setIsSavingCron] = React.useState(false);

  React.useEffect(() => {
    if (status?.cron) setCron(status.cron);
  }, [status?.cron]);

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

  const saveSchedule = async () => {
    if (!cron.trim()) return toast.error('Enter a cron expression');
    setIsSavingCron(true);
    const response = await backupApi.updateConfig(cron.trim());
    if (response.success) {
      toast.success('Backup schedule updated');
      await refetch();
    } else {
      toast.error(response.error?.message || 'Failed to update backup schedule');
    }
    setIsSavingCron(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
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

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <label className="block flex-1">
            <span className="mb-1.5 block text-sm font-black text-gray-900">Backup Schedule Cron</span>
            <input
              value={cron}
              onChange={(event) => setCron(event.target.value)}
              placeholder="0 2 * * *"
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 font-mono text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)]"
            />
          </label>
          <button
            type="button"
            onClick={saveSchedule}
            disabled={isSavingCron}
            className="theme-accent-btn inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black"
          >
            {isSavingCron ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
