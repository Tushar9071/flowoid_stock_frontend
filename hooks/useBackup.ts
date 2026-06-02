import { useState, useEffect, useCallback } from 'react';
import { backupApi, BackupStatus, BackupEntry } from '@/lib/api/backup';

export function useBackupStatus() {
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    const res = await backupApi.getStatus();
    if (res.success) {
      setStatus(res.data);
      setError(null);
    } else {
      setError(res.error?.message || 'Failed to fetch backup status');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { status, isLoading, error, refetch: fetchStatus };
}

export function useBackupList() {
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBackups = useCallback(async () => {
    setIsLoading(true);
    const res = await backupApi.getList();
    if (res.success) {
      const responseData: any = res.data;
      const backupsArray = Array.isArray(responseData)
        ? responseData
        : (responseData?.data || responseData?.items || responseData?.backups || []);
      setBackups(backupsArray);
      setError(null);
    } else {
      setError(res.error?.message || 'Failed to fetch backup list');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  return { backups, isLoading, error, refetch: fetchBackups };
}
