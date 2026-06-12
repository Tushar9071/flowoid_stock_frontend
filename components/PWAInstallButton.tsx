'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export function PWAInstallButton({ compact = false }: { compact?: boolean }) {
  const { installPrompt, isInstalled, triggerInstall } = usePWA();

  const [showFallbackModal, setShowFallbackModal] = useState(false);

  if (isInstalled) return null;

  const handleInstall = async () => {
    if (installPrompt) {
      await triggerInstall();
      return;
    }

    // Show nice custom modal instead of ugly window.alert
    setShowFallbackModal(true);
  };

  return (
    <>
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

      {/* Fallback Install Instructions Modal */}
      {showFallbackModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFallbackModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                <Download className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-[20px] font-bold text-[#0F2A4A] mb-2">Install StockFlow</h3>
              <p className="text-[14px] text-[#6b7280] mb-6 leading-relaxed">
                To install the app, please open your browser's menu (usually <span className="font-bold">⋮</span> or <span className="font-bold">↑</span>) and select <span className="font-bold text-slate-900">"Install app"</span> or <span className="font-bold text-slate-900">"Add to Home Screen"</span>.
              </p>
              <button
                onClick={() => setShowFallbackModal(false)}
                className="w-full bg-[#0F2A4A] hover:bg-[#1a3d66] text-white font-bold py-3 rounded-xl transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
