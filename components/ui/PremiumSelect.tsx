'use client';

import React, { Children, isValidElement } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';

interface PremiumSelectProps {
  value?: string | number;
  onChange?: (e: { target: { value: string } }) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  'data-invalid'?: boolean;
}

export function PremiumSelect({
  value,
  onChange,
  required,
  disabled,
  className,
  children,
  'data-invalid': dataInvalid,
}: PremiumSelectProps) {
  const options: { value: string; label: React.ReactNode; disabled?: boolean }[] = [];
  let placeholder: React.ReactNode = 'Select...';

  // Parse children to build the list of options
  React.Children.toArray(children).forEach(child => {
    if (isValidElement(child) && child.type === 'option') {
      const props = child.props as any;
      if (props.value === '' || props.value === undefined) {
        placeholder = props.children;
      }
      options.push({
        value: String(props.value || ''),
        label: props.children,
        disabled: props.disabled,
      });
    }
  });

  const handleValueChange = (val: string) => {
    if (onChange) {
      onChange({ target: { value: val } });
    }
  };

  const stringValue = String(value ?? '');
  const selectedOption = options.find(o => o.value === stringValue);

  return (
    <SelectPrimitive.Root
      value={stringValue}
      onValueChange={handleValueChange}
      disabled={disabled}
      required={required}
    >
      <SelectPrimitive.Trigger
        className={`flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50 ${
          dataInvalid ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
        } ${className || ''}`}
      >
        <SelectPrimitive.Value placeholder={placeholder}>
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="relative z-[2000] max-h-80 w-full min-w-[8rem] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xl animate-in fade-in-80 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
          position="popper"
          sideOffset={4}
          style={{ width: 'var(--radix-select-trigger-width)' }}
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((opt, i) => {
              if (opt.value === '' && i === 0) return null; // Skip placeholder option in the list
              return (
                <SelectPrimitive.Item
                  key={`${opt.value}-${i}`}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-9 pr-2 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[state=checked]:bg-indigo-50 data-[state=checked]:font-semibold data-[state=checked]:text-indigo-900"
                >
                  <span className="absolute left-3 flex h-3.5 w-3.5 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4 text-indigo-600" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              );
            })}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
