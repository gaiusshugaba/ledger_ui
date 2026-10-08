// components/SlackChannelRow.tsx
'use client';

import { ChannelDropdown } from './ChannelDropdown';

export function SlackChannelRow({
  title,
  subtitle,
  value,
  onChange,
  options,
}: {
  title: string;
  subtitle: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-5 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-900">{title}</p>
        <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>
      </div>

      <ChannelDropdown
        value={value}
        onChange={onChange}
        options={options}
        width="wide"
      />
    </div>
  );
}