// components/VendorsTable.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Pencil } from 'lucide-react';

export type VendorInvoice = {
  id: string;
  invoiceNumber: string;
  date: string | null;
  amount: number | null;
  currency: string;
  status: string;
  confidence: number;
};

export type VendorRow = {
  id: string;
  name: string;
  aliases: string[];
  invoiceCount: number;
  confSum: number;
  confCount: number;
  avgConfidence: number;
  lastSeenIso: string | null;
  lastSeen: string;
  invoices: VendorInvoice[];
};

const MAIN_GRID =
  'grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_40px]';

const INNER_GRID =
  'grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]';

export function VendorsTable({ rows }: { rows: VendorRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <p className="py-24 text-center text-sm text-neutral-400">
        No vendors yet.
      </p>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        className={`grid ${MAIN_GRID} items-center gap-4 border-b border-neutral-100 px-6 py-4 text-[11px] font-medium uppercase tracking-wider text-neutral-500`}
      >
        <span>Vendor</span>
        <span>Aliases</span>
        <span className="text-right">Invoices</span>
        <span className="text-right">Avg Confidence</span>
        <span>Last Seen</span>
        <span />
      </div>

      {rows.map((v) => {
        const expanded = expandedId === v.id;
        return (
          <div key={v.id} className="border-b border-neutral-100 last:border-b-0">
            {/* Main row */}
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : v.id)}
              className={`grid ${MAIN_GRID} w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-neutral-50 ${
                expanded ? 'bg-neutral-50/60' : ''
              }`}
            >
              <p className="truncate text-sm font-medium text-neutral-900">
                {v.name}
              </p>

              <div className="flex flex-wrap items-center gap-1.5">
                {v.aliases.length > 0 ? (
                  v.aliases.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-700"
                    >
                      {a}
                    </span>
                  ))
                ) : v.avgConfidence >= 0.7 ? (
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-700">
                    {v.name}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-[#FDE8E8] px-2.5 py-0.5 text-[11px] font-medium text-[#9B1C1C]">
                    Unknown vendor
                  </span>
                )}
              </div>

              <p className="text-right text-sm text-neutral-700">
                {v.invoiceCount}{' '}
                {v.invoiceCount === 1 ? 'invoice' : 'invoices'}
              </p>

              <ConfidenceCell value={v.avgConfidence} />

              <p className="text-sm text-neutral-500">{v.lastSeen}</p>

              <span className="justify-self-end text-neutral-400">
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </span>
            </button>

            {/* Expanded panel */}
            {expanded && (
              <div className="border-t border-neutral-100 bg-neutral-50/40 px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Configured Aliases ({v.aliases.length})
                    </h3>
                    <span className="text-xs text-neutral-500">
                      Primary Match Key:{' '}
                      <span className="font-mono text-neutral-700">
                        {v.name.toUpperCase().replace(/\s+/g, '-')}-CORP
                      </span>
                    </span>
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add alias
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {v.aliases.length === 0 ? (
                    <p className="text-xs text-neutral-500">
                      No aliases configured. Add one to improve future matches.
                    </p>
                  ) : (
                    v.aliases.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-800"
                      >
                        {a}
                        <Pencil className="h-3 w-3 text-neutral-400" />
                      </span>
                    ))
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-neutral-900">
                    Recent Invoices ({v.invoices.length})
                  </h4>
                  <span className="text-xs text-neutral-500">
                    Filtered by vendor alias rules
                  </span>
                </div>

                <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                  <div
                    className={`grid ${INNER_GRID} items-center gap-4 border-b border-neutral-100 bg-neutral-50/60 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-500`}
                  >
                    <span>Invoice #</span>
                    <span>Date</span>
                    <span className="text-right">Amount</span>
                    <span>Match Status</span>
                    <span className="text-right">Confidence</span>
                  </div>

                  {v.invoices.slice(0, 5).map((inv) => (
                    <div
                      key={inv.id}
                      className={`grid ${INNER_GRID} items-center gap-4 border-b border-neutral-100 px-5 py-3.5 last:border-b-0`}
                    >
                      <p className="truncate font-mono text-sm text-neutral-900">
                        {inv.invoiceNumber}
                      </p>
                      <p className="text-sm text-neutral-600">
                        {formatDate(inv.date)}
                      </p>
                      <p className="text-right text-sm text-neutral-900">
                        {formatMoney(inv.amount, inv.currency)}
                      </p>
                      <div>
                        <StatusPill status={inv.status} />
                      </div>
                      <p className="text-right text-sm text-neutral-900">
                        {inv.confidence.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConfidenceCell({ value }: { value: number }) {
  const dot =
    value >= 0.9
      ? 'bg-emerald-500'
      : value >= 0.7
      ? 'bg-amber-500'
      : 'bg-red-500';
  return (
    <div className="flex items-center justify-end gap-2">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <span className="text-sm font-medium text-neutral-900">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const v = (status || '').toLowerCase();
  let cls = 'bg-neutral-100 text-neutral-600';
  let label = status || '—';

  if (v === 'reconciled' || v === 'paid' || v === 'approved') {
    cls = 'bg-[#DEF7EC] text-[#03543F]';
    label = 'Reconciled';
  } else if (v.startsWith('exc')) {
    cls = 'bg-[#FDE8E8] text-[#9B1C1C]';
    label = 'Exception';
  } else if (v.startsWith('rev') || v === 'review_required') {
    cls = 'bg-[#FEF3C7] text-[#92400E]';
    label = 'Review';
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatMoney(v: number | null, currency: string): string {
  if (v == null) return '—';
  const symbol = currency === 'USD' || !currency ? '$' : `${currency} `;
  return `${symbol}${v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}