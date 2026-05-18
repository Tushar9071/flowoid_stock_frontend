import { api } from '../api-client';

export interface BackupStatus {
  lastBackupDate: string | null;
  nextScheduledDate: string | null;
  lastBackupStatus: 'SUCCESS' | 'FAILED' | null;
}

export interface BackupEntry {
  filename: string;
  date: string;
  sizeBytes: number;
  status: 'SUCCESS' | 'FAILED';
}

export const backupApi = {
  getStatus: () => api.get<BackupStatus>('/admin/backup/status'),
  getList: () => api.get<BackupEntry[]>('/admin/backup/list'),
  triggerBackup: () => api.post<{ success: boolean; message?: string }>('/admin/backup/trigger'),
};
