// components/KpiCard.tsx
import type { LucideIcon } from 'lucide-react';

type Props = {
  label: string;
  value: string;
  caption: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

export function KpiCard({ label, value, caption, icon: Icon, iconBg, iconColor }: Props) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
          {label}
        </p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={2} />
        </div>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
        {value}
      </p>
      <p className="mt-1.5 text-xs text-neutral-500">{caption}</p>
    </div>
  );
}