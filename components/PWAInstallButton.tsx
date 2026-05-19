'use client';

import { Download } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export function PWAInstallButton({ compact = false }: { compact?: boolean }) {
  const { installPrompt, isInstalled, triggerInstall } = usePWA();

  if (isInstalled) return null;

  const handleInstall = async () => {
    if (installPrompt) {
      await triggerInstall();
      return;
    }

    window.alert('To install StockFlow, open your browser menu and choose "Install app" or "Add to Home Screen".');
  };

  return (
    <button
      type="button"
      onClick={handleInstall}
      className={
        compact
          ? 'inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#0F2A4A] shadow-sm transition-colors hover:bg-[#f9fafb]'
          : 'inline-flex h-11 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-bold text-[#1B2D4F] shadow-sm transition-colors hover:bg-[#F8F9FC]'
      }
      aria-label="Install StockFlow app"
      title="Install StockFlow app"
    >
      <Download className="h-4 w-4" />
      {!compact && <span>Install App</span>}
    </button>
  );
}
