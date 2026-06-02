'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

const AUTO_HIDE_MS = 9000;

export function PWAInstallNudge({ delayMs = 900 }: { delayMs?: number }) {
  const { installPrompt, isInstalled, canShowInstallFallback, triggerInstall } = usePWA();
  const [shouldShow, setShouldShow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const delayTimer = window.setTimeout(() => {
      setShouldShow(true);
    }, delayMs);

    return () => window.clearTimeout(delayTimer);
  }, [delayMs]);

  useEffect(() => {
    if (!shouldShow) return undefined;

    const revealTimer = window.setTimeout(() => setIsVisible(true), 60);
    const autoHideTimer = window.setTimeout(() => {
      setIsVisible(false);
      window.setTimeout(() => setShouldShow(false), 200);
    }, AUTO_HIDE_MS);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(autoHideTimer);
    };
  }, [shouldShow]);

  if (!shouldShow || isInstalled || (!installPrompt && !canShowInstallFallback)) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    window.setTimeout(() => setShouldShow(false), 200);
  };

  const handleInstall = async () => {
    if (installPrompt) {
      await triggerInstall();
      setShouldShow(false);
      return;
    }

    window.alert('To install StockFlow, open your browser menu and choose "Install app" or "Add to Home Screen".');
  };

  return (
    <div
      className={`fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px)+72px)] right-4 z-[1100] w-[calc(100%-2rem)] max-w-md transform transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:bottom-6 sm:right-6 sm:w-[calc(100%-3rem)] ${
        isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-6 scale-[0.98] opacity-0'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-lg transition-shadow duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#D4A843]/15 to-transparent" />
        <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#D4A843]/20 blur-2xl animate-pulse" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#0F1C2E]">Install the StockFlow app</p>
          <p className="text-xs text-[#4B5C72]">
            Faster repeat visits, offline-ready, and a home screen shortcut for your team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstall}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1B2D4F] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#16253F]"
          >
            <Download className="h-4 w-4" />
            Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#E2E8F0] px-3 text-xs font-semibold text-[#4B5C72] transition-colors hover:bg-[#F8F9FC]"
            aria-label="Dismiss install prompt"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
