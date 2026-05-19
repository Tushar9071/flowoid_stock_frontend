'use client';

import { useEffect, useMemo, useState } from 'react';

export function TimeDisplay() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      }),
    []
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    []
  );

  if (!now) {
    return (
      <div className="inline-flex items-center gap-3 rounded-full border border-[#E2E8F0] bg-white/90 px-4 py-2 text-sm text-[#1B2D4F] shadow-sm">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.65)]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[#4B5C72]">Local time</span>
        <span className="font-semibold">--:--:--</span>
        <span className="text-[#4B5C72]">---</span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-3 rounded-full border border-[#E2E8F0] bg-white/90 px-4 py-2 text-sm text-[#1B2D4F] shadow-sm"
      aria-live="polite"
    >
      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.65)]" />
      <span className="text-xs font-semibold uppercase tracking-wider text-[#4B5C72]">Local time</span>
      <span className="font-semibold">{timeFormatter.format(now)}</span>
      <span className="text-[#4B5C72]">{dateFormatter.format(now)}</span>
    </div>
  );
}
