// app/reconciled/ReconciledContent.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Download } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { ReconciledStatsBar } from '@/components/ReconciledStatsBar';
import { ReconciledTable, type ReconciledRow } from '@/components/ReconciledTable';
import { ReconciledPagination } from '@/components/ReconciledPagination';
import { createClient } from '@/lib/supabase/client';

const PAGE_SIZE = 9;

type RawInvoice = {
  id: string;
  status: string;
  created_at: string | null;
  processed_at: string | null;
  extraction: any;
  match: any;
};

export function ReconciledContent() {
  const [raw, setRaw] = useState<RawInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          status,
          created_at,
          processed_at,
          extraction:extractions(
            vendor_name,
            invoice_number,
            amount,
            currency,
            po_number,
            vendor_confidence,
            invoice_number_confidence,
            amount_confidence,
            po_confidence,
            invoice_date_confidence,
            tax_confidence,
            currency_confidence
          ),
          match:matches(tier_reason)
        `)
        .eq('status', 'reconciled')
        .order('processed_at', { ascending: false })
        .limit(500);

      if (cancelled) return;

      if (error) {
        console.error('[reconciled] supabase error:', error);
        setErrorMsg(`${error.message} (${error.code})`);
        setLoading(false);
        return;
      }

      console.log('[reconciled] rows:', data?.length ?? 0);
      setRaw((data ?? []) as RawInvoice[]);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Derived rows ────────────────────────────────────────
  const rows: ReconciledRow[] = useMemo(
    () => raw.map(toReconciledRow),
    [raw],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.vendor.toLowerCase().includes(q) ||
        r.invoiceNumber.toLowerCase().includes(q) ||
        r.matchedPo.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // ── Stats ───────────────────────────────────────────────
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    let todayCount = 0;
    let weekCount = 0;
    let matchedCount = 0;

    for (const r of raw) {
      const iso = r.processed_at ?? r.created_at;
      if (iso) {
        const d = new Date(iso);
        if (d >= today) todayCount++;
        if (d >= startOfWeek) weekCount++;
      }
      const ex = Array.isArray(r.extraction) ? r.extraction[0] : r.extraction;
      if (ex?.po_number) matchedCount++;
    }

    const rate = raw.length > 0 ? Math.round((matchedCount / raw.length) * 100) : 0;
    return { todayCount, weekCount, rate, total: raw.length };
  }, [raw]);

  function exportCsv() {
    const header = ['Vendor', 'Invoice #', 'Amount', 'Matched PO', 'Confidence', 'Processed'];
    const lines = [header.join(',')].concat(
      filtered.map((r) =>
        [
          csvEscape(r.vendor),
          csvEscape(r.invoiceNumber),
          csvEscape(r.amount),
          csvEscape(r.matchedPo),
          String(r.confidence ?? ''),
          csvEscape(r.processedAt),
        ].join(','),
      ),
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconciled-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-screen bg-[#FCFCFA] text-neutral-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-neutral-200 px-8 pt-6 pb-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Reconciled
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                {stats.weekCount} invoices this week
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search reconciled Invoices……"
                  className="w-80 rounded-full border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/5"
                />
              </div>

              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          <ReconciledStatsBar
            todayCount={stats.todayCount}
            weekCount={stats.weekCount}
            matchRate={stats.rate}
          />

          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            {loading ? (
              <p className="py-24 text-center text-sm text-neutral-400">Loading…</p>
            ) : errorMsg ? (
              <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <strong>Failed to load:</strong> {errorMsg}
              </div>
            ) : (
              <ReconciledTable rows={pageRows} />
            )}

            <ReconciledPagination
              total={filtered.length}
              page={currentPage}
              pageSize={PAGE_SIZE}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────
function toReconciledRow(raw: RawInvoice): ReconciledRow {
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
    vendor: ex?.vendor_name || '—',
    invoiceNumber: ex?.invoice_number || '—',
    amount: formatMoney(ex?.amount, ex?.currency),
    matchedPo: ex?.po_number || '—',
    confidence,
    processedAt: timeAgo(raw.processed_at ?? raw.created_at),
  };
}

function formatMoney(
  v: number | string | null | undefined,
  currency?: string,
): string {
  if (v == null) return '—';
  const n = typeof v === 'string' ? Number(v.replace(/[^0-9.-]/g, '')) : v;
  if (!Number.isFinite(n)) return '—';
  const symbol = currency === 'USD' || !currency ? '$' : `${currency} `;
  return `${symbol}${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

function csvEscape(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}