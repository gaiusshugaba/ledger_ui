// components/QueueRow.tsx
'use client';

import Link from 'next/link';
import { FileText, Mail, Loader2 } from 'lucide-react';

export type Status =
  | 'Exception'
  | 'Review'
  | 'Approved'
  | 'Paid'
  | 'Reconciled';

export type QueueInvoice = {
  id: string;
  status: Status;
  company: string;
  amount: string;
  invoiceNumber: string;
  itemCount: number;
  age: string;
  source: 'Email' | 'Upload';
  reason?: string;
};

const statusStyles: Record<Status, string> = {
  Exception: 'bg-[#FDE8E8] text-[#9B1C1C]',
  Review: 'bg-[#FEF3C7] text-[#92400E]',
  Approved: 'bg-[#DEF7EC] text-[#03543F]',
  Paid: 'bg-[#E5E7EB] text-[#374151]',
  Reconciled: 'bg-[#DEF7EC] text-[#03543F]',
};

export function QueueRow({
  invoice,
  onApprove,
  onReject,
  busy,
}: {
  invoice: QueueInvoice;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  busy?: boolean;
}) {
  const styles = statusStyles[invoice.status] ?? statusStyles.Review;
  // Approve is only allowed when the invoice is in the Review tier.
  // Exceptions must be opened and resolved individually first.
  const canApprove = invoice.status === 'Review';

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 transition-shadow hover:border-neutral-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-6">
        {/* ── Left column ─────────────────────────── */}
        <div className="min-w-0 flex-1">
          <Link href={`/queue/${invoice.id}`} className="inline-block">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${styles}`}
            >
              {invoice.status}
            </span>
          </Link>

          <Link href={`/queue/${invoice.id}`} className="block">
            <h3 className="mt-3 truncate text-sm font-semibold text-neutral-900">
              {invoice.company}
            </h3>

            <div className="mt-1.5 flex items-center gap-2 text-xs text-neutral-500">
              <span className="font-mono">{invoice.invoiceNumber}</span>
              <span className="text-neutral-300">·</span>
              <span>
                {invoice.itemCount}{' '}
                {invoice.itemCount === 1 ? 'item' : 'items'}
              </span>
              <span className="text-neutral-300">·</span>
              <Mail className="h-3.5 w-3.5" />
              <span>{invoice.source}</span>
            </div>

            {invoice.reason && (
              <div className="mt-3 flex items-start gap-2 text-sm text-neutral-700">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                <p>{invoice.reason}</p>
              </div>
            )}
          </Link>
        </div>

        {/* ── Right column ────────────────────────── */}
        <div className="flex shrink-0 flex-col items-end gap-3">
          <span className="text-xs text-neutral-400">{invoice.age}</span>
          <span className="text-sm font-semibold text-neutral-900">
            {invoice.amount}
          </span>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onReject?.(invoice.id)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Reject
            </button>
            <button
              type="button"
              disabled={!canApprove || busy}
              onClick={() => onApprove?.(invoice.id)}
              className={
                canApprove && !busy
                  ? 'inline-flex items-center justify-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-neutral-800'
                  : 'inline-flex cursor-not-allowed items-center justify-center gap-1.5 rounded-full bg-[#F3F4F6] px-4 py-2 text-xs font-medium text-[#9CA3AF]'
              }
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}