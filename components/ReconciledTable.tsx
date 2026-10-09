// components/ReconciledTable.tsx
'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';

export type ReconciledRow = {
  id: string;
  vendor: string;
  invoiceNumber: string;
  amount: string;
  matchedPo: string;
  confidence: number | null;
  processedAt: string;
};

const GRID =
  'grid-cols-[52px_minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)]';

export function ReconciledTable({ rows }: { rows: ReconciledRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-24 text-center text-sm text-neutral-400">
        No reconciled invoices to show.
      </p>
    );
  }

  return (
    <div>
      <div
        className={`grid ${GRID} items-center gap-4 border-b border-neutral-100 px-6 py-4 text-[11px] font-medium uppercase tracking-wider text-neutral-500`}
      >
        <span />
        <span>Invoice</span>
        <span className="text-right">Amount</span>
        <span>Matched PO</span>
        <span>Confidence</span>
        <span>Processed</span>
        <span className="text-right">Actions</span>
      </div>

      {rows.map((row) => (
        <div
          key={row.id}
          className={`grid ${GRID} items-center gap-4 border-b border-neutral-100 px-6 py-4 last:border-b-0`}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DEF7EC]">
            <Check className="h-3.5 w-3.5 text-[#03543F]" strokeWidth={3} />
          </div>

          <Link href={`/queue/${row.id}`} className="block min-w-0">
            <p className="truncate text-sm font-medium text-neutral-900 hover:underline">
              {row.vendor}
            </p>
            <p className="truncate font-mono text-xs text-neutral-500">
              {row.invoiceNumber}
            </p>
          </Link>

          <p className="text-right text-sm font-medium text-neutral-900">
            {row.amount}
          </p>

          <p className="font-mono text-sm text-neutral-600">{row.matchedPo}</p>

          <ConfidenceCell value={row.confidence} />

          <p className="text-sm text-neutral-500">{row.processedAt}</p>

          <div className="flex justify-end">
            <Link
              href={`/queue/${row.id}`}
              className="rounded-full border border-neutral-200 bg-white px-5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
            >
              View
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfidenceCell({ value }: { value: number | null }) {
  if (value == null) {
    return <span className="text-sm text-neutral-400">—</span>;
  }
  const dot =
    value >= 0.9
      ? 'bg-emerald-500'
      : value >= 0.7
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span className="text-sm font-medium text-neutral-900">
        {value.toFixed(2)}
      </span>
    </div>
  );
}