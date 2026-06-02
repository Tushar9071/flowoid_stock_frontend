'use client';

import { usePWA } from '@/hooks/usePWA';

export function PWAInstallBanner() {
  const { isOnline, updateAvailable, applyUpdate } = usePWA();

  if (!isOnline) {
    return (
      <div className="pwa-status-toast pwa-status-toast--offline" role="alert">
        <span>You're offline - showing cached data</span>
      </div>
    );
  }

  if (updateAvailable) {
    return (
      <div className="pwa-status-toast pwa-status-toast--update" role="alert">
        <span>New version available</span>
        <button onClick={applyUpdate} className="pwa-status-toast-btn">Update Now</button>
      </div>
    );
  }

  return null;
}
