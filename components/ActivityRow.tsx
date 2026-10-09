// components/ActivityRow.tsx
'use client';

import Link from 'next/link';
import {
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Calendar,
  CornerDownRight,
} from 'lucide-react';
import type { Status } from './QueueRow';

export type ActivityInvoice = {
  id: string;
  vendor: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  status: Status;
  age: string;
  reasons: string[];
};

const statusStyles: Record<Status, string> = {
  Exception: 'bg-[#FDE8E8] text-[#9B1C1C]',
  Review: 'bg-[#FEF3C7] text-[#92400E]',
  Reconciled: 'bg-[#DEF7EC] text-[#03543F]',
  Approved: 'bg-[#DEF7EC] text-[#03543F]',
  Paid: 'bg-[#E5E7EB] text-[#374151]',
  Processing: 'bg-[#DBEAFE] text-[#1E40AF]',
  Failed: 'bg-[#FDE8E8] text-[#9B1C1C]',
  Rejected: 'bg-[#E5E7EB] text-[#374151]',
};

export function ActivityRow({
  invoice,
  expanded,
  onToggle,
}: {
  invoice: ActivityInvoice;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isFlagged =
    invoice.status === 'Exception' || invoice.status === 'Review';
  const canExpand = isFlagged && invoice.reasons.length > 0;
  const reviewHref = `/queue/${invoice.id}`;

  return (
    <div className="border-b border-neutral-100 last:border-b-0">
      <div className="grid grid-cols-[44px_1fr_140px_160px_140px_120px_180px] items-center gap-4 px-5 py-4">
        <StatusDot status={invoice.status} />

        <Link href={reviewHref} className="block min-w-0">
          <p className="truncate text-sm font-medium text-neutral-900 hover:underline">
            {invoice.vendor}
          </p>
          <p className="truncate font-mono text-xs text-neutral-500">
            {invoice.invoiceNumber}
          </p>
        </Link>

        <p className="text-right text-sm font-medium text-neutral-900">
          {invoice.amount}
        </p>

        <div className="flex items-center gap-1.5 text-sm text-neutral-600">
          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
          <span>{invoice.dueDate}</span>
        </div>

        <div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${statusStyles[invoice.status]}`}
          >
            {invoice.status}
          </span>
        </div>

        <p className="text-xs text-neutral-500">{invoice.age}</p>

        <div className="flex items-center justify-end gap-2">
          <Link
            href={reviewHref}
            className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
          >
            {actionLabel(invoice.status)}
          </Link>
          {canExpand && (
            <button
              type="button"
              onClick={onToggle}
              aria-label={expanded ? 'Collapse' : 'Expand'}
              className="text-neutral-400 transition-colors hover:text-neutral-600"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {expanded && canExpand && (
        <div
          className={`px-5 py-4 pl-[68px] ${
            invoice.status === 'Exception' ? 'bg-[#FDF2F2]' : 'bg-[#FBF6EA]'
          }`}
        >
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
            <CornerDownRight className="h-3.5 w-3.5 text-neutral-500" />
            <span className="text-neutral-700">Why is this flagged</span>
          </div>
          <ul className="mt-2 space-y-1.5">
            {invoice.reasons.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-neutral-700"
              >
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    invoice.status === 'Exception'
                      ? 'bg-[#D14343]'
                      : 'bg-[#D9A441]'
                  }`}
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function actionLabel(status: Status): string {
  if (status === 'Reconciled' || status === 'Paid' || status === 'Approved')
    return 'View';
  if (status === 'Exception') return 'Resolve';
  return 'Review';
}

function StatusDot({ status }: { status: Status }) {
  if (status === 'Reconciled' || status === 'Approved') {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DEF7EC]">
        <Check className="h-3.5 w-3.5 text-[#03543F]" strokeWidth={3} />
      </div>
    );
  }
  if (status === 'Exception' || status === 'Failed') {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FDE8E8]">
        <X className="h-3.5 w-3.5 text-[#9B1C1C]" strokeWidth={3} />
      </div>
    );
  }
  if (status === 'Review') {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FEF3C7]">
        <span className="text-[12px] font-bold text-[#92400E]">!</span>
      </div>
    );
  }
  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100">
      <span className="text-[12px] font-bold text-neutral-500">·</span>
    </div>
  );
}