// components/RecentUploadsTable.tsx
'use client';

import Link from 'next/link';
import { Upload as UploadIcon, Mail, Loader2 } from 'lucide-react';
import type { Status } from './QueueRow';

export type UploadRow = {
  id: string;
  filename: string;
  source: 'Email' | 'Upload';
  status: Status;
  confidence: number | null;
  uploadedAt: string;
};

const statusStyles: Record<string, string> = {
  Exception: 'bg-[#FDE8E8] text-[#9B1C1C]',
  Review: 'bg-[#FEF3C7] text-[#92400E]',
  Approved: 'bg-[#DEF7EC] text-[#03543F]',
  Reconciled: 'bg-[#DEF7EC] text-[#03543F]',
  Paid: 'bg-[#E5E7EB] text-[#374151]',
  Processing: 'bg-[#DBEAFE] text-[#1E40AF]',
  Failed: 'bg-[#FDE8E8] text-[#9B1C1C]',
  Rejected: 'bg-[#E5E7EB] text-[#374151]',
};

const GRID =
  'grid-cols-[minmax(0,1.7fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)]';

export function RecentUploadsTable({ rows }: { rows: UploadRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-neutral-400">
        No uploads yet.
      </p>
    );
  }

  return (
    <div>
      <div
        className={`grid ${GRID} items-center gap-4 border-y border-neutral-100 bg-neutral-50/60 px-6 py-3 text-[11px] font-medium uppercase tracking-wider text-neutral-500`}
      >
        <span>Filename</span>
        <span>Source</span>
        <span>Status</span>
        <span>Confidence</span>
        <span>Uploaded at</span>
        <span className="text-right">Actions</span>
      </div>

      {rows.map((row) => {
        const inFlight = row.status === 'Processing';
        return (
          <div
            key={row.id}
            className={`grid ${GRID} items-center gap-4 border-b border-neutral-100 px-6 py-5 last:border-b-0`}
          >
            <Link
              href={`/queue/${row.id}`}
              className="min-w-0 hover:underline"
            >
              <p className="truncate text-sm font-medium text-neutral-900">
                {row.filename}
              </p>
            </Link>

            <div className="flex items-center gap-2 text-sm text-neutral-600">
              {row.source === 'Email' ? (
                <Mail className="h-4 w-4 text-neutral-400" />
              ) : (
                <UploadIcon className="h-4 w-4 text-neutral-400" />
              )}
              <span>{row.source}</span>
            </div>

            <div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium ${
                  statusStyles[row.status] ?? statusStyles.Review
                }`}
              >
                {inFlight && <Loader2 className="h-3 w-3 animate-spin" />}
                {row.status}
              </span>
            </div>

            <ConfidenceCell value={row.confidence} />

            <p className="text-sm text-neutral-500">{row.uploadedAt}</p>

            <div className="flex justify-end">
              {inFlight ? (
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-full border border-neutral-200 bg-white px-5 py-2 text-xs font-medium text-neutral-300"
                >
                  Pending
                </button>
              ) : (
                <Link
                  href={`/queue/${row.id}`}
                  className="rounded-full border border-neutral-200 bg-white px-5 py-2 text-xs font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
                >
                  {actionLabel(row.status)}
                </Link>
              )}
            </div>
          </div>
        );
      })}
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
  const text =
    value >= 0.9
      ? 'text-emerald-700'
      : value >= 0.7
      ? 'text-amber-700'
      : 'text-red-700';

  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span className={`text-sm font-semibold ${text}`}>{value.toFixed(2)}</span>
    </div>
  );
}

function actionLabel(status: Status | string): string {
  if (status === 'Reconciled' || status === 'Paid' || status === 'Approved')
    return 'View';
  if (status === 'Exception' || status === 'Failed') return 'Resolve';
  if (status === 'Rejected') return 'View';
  return 'Review';
}