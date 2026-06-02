import { api } from '../api-client';
import { asListResponse } from '../services/api-normalizers';

export interface BackupStatus {
  lastBackupDate: string | null;
  nextScheduledDate: string | null;
  lastBackupStatus: 'SUCCESS' | 'FAILED' | null;
  cron?: string | null;
}

export interface BackupEntry {
  id?: string;
  filename?: string;
  fileName?: string;
  fileSizeBytes?: string | number | null;
  date?: string;
  createdAt?: string;
  sizeBytes?: number;
  status: 'SUCCESS' | 'FAILED';
  notes?: string | null;
}

function normalizeBackup(backup: BackupEntry): BackupEntry {
  return {
    ...backup,
    filename: backup.filename || backup.fileName,
    sizeBytes: Number(backup.sizeBytes ?? backup.fileSizeBytes ?? 0),
    date: backup.date || backup.createdAt,
  };
}

export const backupApi = {
  async getStatus() {
    const [response, configResponse] = await Promise.all([
      asListResponse<BackupEntry>(await api.get('/admin/backups?per_page=1'), 'backups'),
      api.get<{ cron: string }>('/admin/backups/config'),
    ]);
    const latest = response.success ? normalizeBackup(response.data.items[0] || {} as BackupEntry) : null;
    return {
      success: response.success,
      data: {
        lastBackupDate: latest?.date || latest?.createdAt || null,
        nextScheduledDate: null,
        lastBackupStatus: latest?.status || null,
        cron: configResponse.success ? configResponse.data.cron : null,
      } satisfies BackupStatus,
      error: response.error,
    };
  },

  async getList() {
    const response = asListResponse<BackupEntry>(await api.get('/admin/backups?per_page=100'), 'backups');
    return response.success
      ? { ...response, data: response.data.items.map(normalizeBackup) }
      : response as any;
  },

  async triggerBackup() {
    const response = await api.post<{ backup?: BackupEntry; message?: string }>('/admin/backups');
    if (!response.success || !response.data?.backup) return response;

    const backup = normalizeBackup(response.data.backup);
    return {
      ...response,
      data: {
        ...response.data,
        backup,
        message: backup.status === 'FAILED'
          ? backup.notes || 'Backup request finished, but pg_dump failed on the backend host.'
          : 'Backup completed successfully',
      },
    };
  },

  async updateConfig(cron: string) {
    return api.put<{ cron: string }>('/admin/backups/config', { cron });
  },

  async deleteBackup(id: string) {
    const response = await api.delete<{ backup?: BackupEntry }>(`/admin/backups/${id}`, { confirm: true });
    if (!response.success || !response.data?.backup) return response;
    return {
      ...response,
      data: {
        ...response.data,
        backup: normalizeBackup(response.data.backup),
      },
    };
  },

  downloadUrl(id: string) {
    return `/api/admin/backups/${id}/download`;
  },
};
