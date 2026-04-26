import React from 'react';
import { statusColors } from '@/lib/constants';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'outline';
}

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const colors = (statusColors as any)[status] || statusColors.draft;

  if (variant === 'outline') {
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border-2 ${colors.bg} ${colors.text}`}>
        <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
        {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
    </span>
  );
}
