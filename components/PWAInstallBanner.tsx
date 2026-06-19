'use client';

import { usePWA } from '@/hooks/usePWA';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { normalizeRole } from '@/lib/roles';

export function PWAInstallBanner() {
  const { isInstalled, updateAvailable, applyUpdate, installPrompt, canShowInstallFallback, triggerInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [hostname, setHostname] = useState('');
  const [mounted, setMounted] = useState(false);
  const [shouldHidePopup, setShouldHidePopup] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(window.location.hostname);
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('flowoid_auth_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const role = user.role ? normalizeRole(user.role) : '';
          
          if ((role === 'owner' || role === 'flowoid_admin') && 
              (pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin'))) {
            setShouldHidePopup(true);
          } else {
            setShouldHidePopup(false);
          }
        }
      } catch (e) {}
    }
  }, [pathname]);

  if (!mounted || dismissed || shouldHidePopup) return null;

  // 1. Update Popup (ONLY when running as installed PWA)
  if (isInstalled && updateAvailable) {
    return (
      <div className="fixed top-4 left-0 right-0 z-[9999] mx-auto w-[calc(100%-2rem)] max-w-sm bg-white rounded-2xl shadow-lg border border-slate-100 p-3 flex items-center justify-between transition-all animate-in slide-in-from-top-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0 bg-slate-100 rounded-xl flex items-center justify-center p-1.5">
            <img src="/Appicon_blue.png" alt="App Icon" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 text-sm">Update StockFlow</span>
            <span className="text-xs text-slate-500">New version available</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={applyUpdate} className="text-sm font-bold text-[#1a73e8] px-3 py-2 rounded-lg hover:bg-blue-50">
            Update
          </button>
          <button onClick={() => setDismissed(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 2. Install Popup (ONLY when running in web browser)
  if (!isInstalled) {
    return (
      <div className="fixed top-4 left-0 right-0 z-[9999] mx-auto w-[calc(100%-2rem)] max-w-sm bg-white rounded-2xl shadow-lg border border-slate-100 p-3 flex items-center justify-between transition-all animate-in slide-in-from-top-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0 bg-slate-100 rounded-xl flex items-center justify-center p-1.5">
            <img src="/Appicon_blue.png" alt="App Icon" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 text-sm">Install StockFlow</span>
            <span className="text-xs text-slate-500">{hostname || 'stockflow.app'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={async () => {
              if (installPrompt) {
                await triggerInstall();
              } else {
                window.alert('To install StockFlow, open your browser menu and choose "Install app" or "Add to Home Screen".');
              }
              setDismissed(true);
            }} 
            className="text-sm font-bold text-[#1a73e8] px-3 py-2 rounded-lg hover:bg-blue-50"
          >
            Install
          </button>
          <button onClick={() => setDismissed(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
