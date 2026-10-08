// app/upload/UploadContent.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { UploadDropzone } from '@/components/UploadDropzone';
import { EmailForwardCard } from '@/components/EmailForwardCard';
import { RecentUploadsTable, type UploadRow } from '@/components/RecentUploadsTable';
import { createClient } from '@/lib/supabase/client';
import type { Status } from '@/components/QueueRow';

type RawInvoice = {
  id: string;
  file_name: string | null;
  source: string | null;
  status: string;
  created_at: string | null;
  uploaded_at: string | null;
  extraction: any;
};

export function UploadContent() {
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

      const normalized = (data ?? []).map(normalizeRow);
      console.log('[upload] rows:', normalized.length);
      setRows(normalized);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const accuracy = useMemo(() => {
    const confidences = rows
      .map((r) => r.confidence)
      .filter((c): c is number => typeof c === 'number' && c > 0);
    if (confidences.length === 0) return null;
    const avg = confidences.reduce((s, c) => s + c, 0) / confidences.length;
    return (avg * 100).toFixed(1);
  }, [rows]);

  const onUploaded = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="flex h-screen bg-[#FCFCFA] text-neutral-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
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

        <div className="px-8 py-6 space-y-6">
          {/* Drop zone + email card */}
          <div className="grid grid-cols-[1.55fr_1fr] gap-6">
            <UploadDropzone onUploaded={onUploaded} />
            <EmailForwardCard email="invoices@ledger.app" />
          </div>

          {/* Recent uploads */}
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">
                  Recent uploads
                </h2>
                <p className="mt-0.5 text-xs text-neutral-500">Last 5 uploads</p>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
                </svg>
                Filter
              </button>
            </div>

            {loading ? (
              <p className="py-16 text-center text-sm text-neutral-400">Loading…</p>
            ) : errorMsg ? (
              <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <strong>Failed to load:</strong> {errorMsg}
              </div>
            ) : (
              <RecentUploadsTable rows={rows.slice(0, 5)} />
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
    source: (raw.source || 'upload').toLowerCase() === 'email' ? 'Email' : 'Upload',
    status: normalizeStatus(raw.status),
    confidence,
    uploadedAt: timeAgo(raw.created_at ?? raw.uploaded_at),
  };
}

function normalizeStatus(s: string | null | undefined): Status {
  const v = (s ?? '').toLowerCase();
  if (v.startsWith('exc')) return 'Exception';
  if (v === 'review_required' || v.startsWith('rev')) return 'Review';
  if (v.startsWith('app')) return 'Approved';
  if (v.startsWith('paid') || v.startsWith('recon')) return 'Reconciled' as Status;
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