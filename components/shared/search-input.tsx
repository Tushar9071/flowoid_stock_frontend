'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  inputClassName?: string;
  iconClassName?: string;
}

export function SearchInput({
  containerClassName,
  inputClassName,
  iconClassName,
  className,
  type = 'text',
  ...props
}: SearchInputProps) {
  return (
    <div className={cn('flex w-full items-center gap-2.5 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 shadow-sm transition-all focus-within:border-[var(--color-border-accent)] focus-within:ring-2 focus-within:ring-[#0F2A4A]/10', containerClassName)}>
      <Search className={cn('pointer-events-none h-4 w-4 shrink-0 text-[#9ca3af]', iconClassName)} />
      <input
        type={type}
        data-slot="search-input"
        className={cn(
          'min-w-0 flex-1 bg-transparent text-sm text-[#0F2A4A] outline-none placeholder:text-[#9ca3af]',
          className,
          inputClassName,
        )}
        {...props}
      />
    </div>
  );
}
