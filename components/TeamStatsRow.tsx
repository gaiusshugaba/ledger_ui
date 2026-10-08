// components/TeamStatsRow.tsx
'use client';

import { FileText, Check, Shield } from 'lucide-react';

export function TeamStatsRow({
  activeSeats,
  totalSeats,
  approvedThisWeek,
  securityMode,
}: {
  activeSeats: number;
  totalSeats: number;
  approvedThisWeek: number;
  securityMode: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Card 1: Active seats */}
      <div className="flex items-start justify-between rounded-2xl border border-neutral-200 bg-white p-5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            Active seats
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
            {activeSeats}
            <span className="ml-1 text-lg font-medium text-neutral-400">
              / {totalSeats}
            </span>
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100">
          <FileText className="h-4 w-4 text-neutral-500" strokeWidth={2} />
        </div>
      </div>

      {/* Card 2: Invoices approved this week */}
      <div className="flex items-start justify-between rounded-2xl border border-neutral-200 bg-white p-5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            Invoices approved this week
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
            {approvedThisWeek}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DEF7EC]">
          <Check className="h-4 w-4 text-[#03543F]" strokeWidth={2.8} />
        </div>
      </div>

      {/* Card 3: Dark security card */}
      <div className="flex items-start justify-between rounded-2xl bg-[#1A1A1A] p-5 text-white">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
            Audit security mode
          </p>
          <p className="mt-3 truncate text-lg font-semibold tracking-tight">
            {securityMode}
          </p>
        </div>
        <span className="ml-3 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#DEF7EC] px-3 py-1 text-[11px] font-medium text-[#03543F]">
          <Shield className="h-3 w-3" strokeWidth={2.5} />
          Enforced
        </span>
      </div>
    </div>
  );
}