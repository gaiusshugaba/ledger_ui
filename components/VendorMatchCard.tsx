// components/VendorMatchCard.tsx
'use client';

import { Pencil } from 'lucide-react';

export function VendorMatchCard({
  vendorName,
  confidence,
  lastMatched,
  invoicesThisYear,
}: {
  vendorName: string;
  confidence: number | null;
  lastMatched: string;
  invoicesThisYear: string;
}) {
  const dotColor =
    confidence == null
      ? 'bg-neutral-300'
      : confidence >= 0.9
      ? 'bg-emerald-500'
      : confidence >= 0.7
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <div className="rounded-xl bg-white px-4 py-4 ring-1 ring-neutral-200">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-semibold text-neutral-900">
            {vendorName}
          </p>
          <p className="mt-1.5 text-[13px] text-neutral-500">
            {lastMatched} · {invoicesThisYear}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${dotColor}`} />
            <span className="text-sm font-semibold text-neutral-900">
              {confidence != null ? confidence.toFixed(2) : '—'}
            </span>
          </div>
          <button
            type="button"
            className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Edit vendor"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}