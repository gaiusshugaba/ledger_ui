// components/TierRoutingRow.tsx
'use client';

import { Mail } from 'lucide-react';
import { ChannelDropdown } from './ChannelDropdown';
import { ToggleSwitch } from './ToggleSwitch';

type Tier = 'Reconciled' | 'Review' | 'Exception';

const tierStyles: Record<Tier, string> = {
  Reconciled: 'bg-[#DEF7EC] text-[#03543F]',
  Review: 'bg-[#FEF3C7] text-[#92400E]',
  Exception: 'bg-[#FDE8E8] text-[#9B1C1C]',
};

export function TierRoutingRow({
  tier,
  title,
  subtitle,
  badge,
  channel,
  onChannelChange,
  mode,
  enabled,
  onToggle,
  channelOptions,
  muted,
}: {
  tier: Tier;
  title: string;
  subtitle: string;
  badge?: string;
  channel: string;
  onChannelChange: (v: string) => void;
  mode: 'Instant' | 'Digest';
  enabled: boolean;
  onToggle: (v: boolean) => void;
  channelOptions: string[];
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-5 first:pt-0 last:pb-0">
      {/* Tier pill */}
      <span
        className={`inline-flex w-[90px] shrink-0 items-center justify-center rounded-full px-3 py-1 text-[11px] font-medium ${tierStyles[tier]}`}
      >
        {tier}
      </span>

      {/* Title + subtitle */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${
            muted ? 'text-neutral-500' : 'text-neutral-900'
          }`}
        >
          {title}
        </p>
        <p className="mt-0.5 truncate text-xs text-neutral-500">{subtitle}</p>
      </div>

      {/* Optional badge (Exception row) */}
      {badge && (
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#FDE8E8] px-3 py-1 text-[11px] font-medium text-[#9B1C1C]">
          <Mail className="h-3.5 w-3.5" />
          {badge}
        </span>
      )}

      {/* Channel dropdown */}
      <ChannelDropdown
        value={channel}
        onChange={onChannelChange}
        options={channelOptions}
        disabled={muted}
      />

      {/* Mode chip */}
      <span
        className={`inline-flex w-[64px] shrink-0 items-center justify-center rounded-full px-3 py-1 text-[11px] font-medium ${
          muted
            ? 'bg-neutral-100 text-neutral-400'
            : 'bg-neutral-100 text-neutral-600'
        }`}
      >
        {mode}
      </span>

      {/* Toggle */}
      <ToggleSwitch checked={enabled} onChange={onToggle} />
    </div>
  );
}