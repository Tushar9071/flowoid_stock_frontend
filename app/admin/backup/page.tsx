'use client';

import React, { useState } from 'react';
import { BackupStatus } from './BackupStatus';
import { BackupList } from './BackupList';

export default function BackupPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleBackupTriggered = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto flex flex-col h-full pb-20">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Database Backup Management</h2>
        <p className="text-sm text-gray-500">Monitor and manage automated and manual database snapshots.</p>
      </div>

      <BackupStatus onBackupTriggered={handleBackupTriggered} />
      
      <BackupList refreshTrigger={refreshTrigger} />
    </div>
  );
}
