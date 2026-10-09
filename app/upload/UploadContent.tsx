// app/upload/UploadContent.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { UploadDropzone } from '@/components/UploadDropzone';
import { EmailForwardCard } from '@/components/EmailForwardCard';
import { RecentUploadsTable, type UploadRow } from '@/components/RecentUploadsTable';
import { createClient } from '@/lib/supabase/client';
import type { Status } from '@/components/QueueRow';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';

type RawInvoice = {
  id: string;
  file_name: string | null;
  source: string | null;
  status: string;
  created_at: string | null;
  uploaded_at: string | null;
  extraction: any;
};

type StatusFilter = 'all' | Status;

const FILTER_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All statuses' },
  { key: 'Processing', label: 'Processing' },
  { key: 'Review', label: 'Review' },
  { key: 'Reconciled', label: 'Reconciled' },
  { key: 'Exception', label: 'Exception' },
  { key: 'Failed', label: 'Failed' },
];

export function UploadContent() {
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest('[data-filter]')) setFilterOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          file_name,
          source,
          status,
          created_at,
          uploaded_at,
          extraction:extractions(
            vendor_confidence,
            invoice_number_confidence,
            invoice_date_confidence,
            amount_confidence,
            po_confidence,
            tax_confidence,
            currency_confidence
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (cancelled) return;

      if (error) {
        console.error('[upload] supabase error:', error);
        setErrorMsg(`${error.message} (${error.code})`);
        setLoading(false);
        return;
      }

      setRows((data ?? []).map(normalizeRow));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    const t = setInterval(() => setRefreshKey((k) => k + 1), 8000);
    return () => clearInterval(t);
  }, []);

  const accuracy = useMemo(() => {
    const confidences = rows
      .map((r) => r.confidence)
      .filter((c): c is number => typeof c === 'number' && c > 0);
    if (confidences.length === 0) return null;
    const avg = confidences.reduce((s, c) => s + c, 0) / confidences.length;
    return (avg * 100).toFixed(1);
  }, [rows]);

  const filtered = useMemo(
    () =>
      filter === 'all' ? rows : rows.filter((r) => r.status === filter),
    [rows, filter],
  );

  const onUploaded = useCallback(() => {
    setTimeout(() => setRefreshKey((k) => k + 1), 800);
  }, []);

  const currentLabel =
    FILTER_OPTIONS.find((o) => o.key === filter)?.label ?? 'All statuses';

  return (
    <div className="flex h-screen bg-[#FCFCFA] text-neutral-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-neutral-200 px-8 pt-6 pb-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Upload invoices
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Drop a file or forward an email – the system handles both
              </p>
            </div>

            <div className="flex items-center gap-5 pt-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-neutral-700">
                  Listener: <span className="font-medium">Active</span>
                </span>
              </div>
              <p className="text-sm text-neutral-700">
                Accuracy rate:{' '}
                <span className="font-medium">
                  {accuracy ? `${accuracy}%` : '—'}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-8 py-6">
          <div className="grid grid-cols-[1.5fr_1fr] gap-6">
            <UploadDropzone onUploaded={onUploaded} />
            <EmailForwardCard email="invoices@ledger.app" />
          </div>

          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">
                  Recent uploads
                </h2>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Live — auto-refreshes every 8 seconds
                </p>
              </div>

              <div className="relative" data-filter>
                <button
                  type="button"
                  onClick={() => setFilterOpen((v) => !v)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
                    filter === 'all'
                      ? 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                      : 'border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800'
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {currentLabel}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
                {filterOpen && (
                  <div className="absolute right-0 top-full z-40 mt-1 w-44 rounded-xl border border-neutral-200 bg-white p-1 shadow-lg">
                    {FILTER_OPTIONS.map((o) => (
                      <button
                        key={o.key}
                        type="button"
                        onClick={() => {
                          setFilter(o.key);
                          setFilterOpen(false);
                        }}
                        className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          filter === o.key
                            ? 'bg-neutral-100 font-medium text-neutral-900'
                            : 'text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <p className="py-16 text-center text-sm text-neutral-400">
                Loading…
              </p>
            ) : errorMsg ? (
              <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <strong>Failed to load:</strong> {errorMsg}
              </div>
            ) : (
              <RecentUploadsTable rows={filtered.slice(0, 8)} />
            )}

            <div className="flex items-center justify-end border-t border-neutral-100 px-5 py-3">
              <a
                href="/queue"
                className="inline-flex items-center gap-1 text-xs font-medium text-neutral-700 hover:text-neutral-900"
              >
                View All in review queue →
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function normalizeRow(raw: RawInvoice): UploadRow {
  const ex = Array.isArray(raw.extraction) ? raw.extraction[0] : raw.extraction;

  const confidences = [
    ex?.vendor_confidence,
    ex?.invoice_number_confidence,
    ex?.invoice_date_confidence,
    ex?.amount_confidence,
    ex?.po_confidence,
    ex?.tax_confidence,
    ex?.currency_confidence,
  ].filter((c): c is number => typeof c === 'number');

  const confidence =
    confidences.length > 0
      ? confidences.reduce((s, c) => s + c, 0) / confidences.length
      : null;

  return {
    id: raw.id,
    filename: raw.file_name || '—',
    source:
      (raw.source || 'upload').toLowerCase() === 'email' ? 'Email' : 'Upload',
    status: normalizeStatus(raw.status),
    confidence,
    uploadedAt: timeAgo(raw.created_at ?? raw.uploaded_at),
  };
}

function normalizeStatus(s: string | null | undefined): Status {
  const v = (s ?? '').toLowerCase();
  if (
    v === 'pending' ||
    v === 'extracting' ||
    v === 'extracted' ||
    v === 'matching'
  ) {
    return 'Processing';
  }
  if (v === 'reconciled' || v.startsWith('recon')) return 'Reconciled';
  if (v === 'review_required' || v.startsWith('rev')) return 'Review';
  if (v === 'exception' || v.startsWith('exc')) return 'Exception';
  if (v === 'approved_for_payment' || v.startsWith('app')) return 'Approved';
  if (v === 'paid') return 'Paid';
  if (v === 'rejected') return 'Rejected';
  if (v === 'failed') return 'Failed';
  return 'Review';
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return '';
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}