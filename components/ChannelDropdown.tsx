// components/ChannelDropdown.tsx
'use client';

import { ChevronDown } from 'lucide-react';

export function ChannelDropdown({
  value,
  onChange,
  options,
  disabled,
  width = 'auto',
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
  width?: 'auto' | 'wide';
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`appearance-none rounded-xl border border-neutral-200 bg-white py-2 pl-3.5 pr-9 text-sm font-medium text-neutral-800 transition-colors focus:border-neutral-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400 ${
          width === 'wide' ? 'w-[320px]' : ''
        }`}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
          disabled ? 'text-neutral-300' : 'text-neutral-400'
        }`}
      />
    </div>
  );
}