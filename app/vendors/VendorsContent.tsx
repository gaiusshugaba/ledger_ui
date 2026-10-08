// app/vendors/VendorsContent.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { VendorsTable, type VendorRow } from '@/components/VendorsTable';
import { ReconciledPagination } from '@/components/ReconciledPagination';
import { createClient } from '@/lib/supabase/client';

const PAGE_SIZE = 9;

type RawExtraction = {
  id: string;
  invoice_id: string;
  vendor_name: string | null;
  vendor_confidence: number | null;
  invoice_number: string | null;
  invoice_date: string | null;
  amount: number | null;
  currency: string | null;
  extracted_at: string | null;
};

type RawInvoice = {
  id: string;
  status: string;
  created_at: string | null;
};

export function VendorsContent() {
  const [extractions, setExtractions] = useState<RawExtraction[]>([]);
  const [invoiceStatus, setInvoiceStatus] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const [exRes, invRes] = await Promise.all([
        supabase
          .from('extractions')
          .select(
            'id, invoice_id, vendor_name, vendor_confidence, invoice_number, invoice_date, amount, currency, extracted_at',
          )
          .order('extracted_at', { ascending: false })
          .limit(1000),
        supabase.from('invoices').select('id, status, created_at').limit(1000),
      ]);

      if (cancelled) return;

      if (exRes.error) {
        console.error('[vendors] extractions error:', exRes.error);
        setErrorMsg(
          `extractions: ${exRes.error.message || JSON.stringify(exRes.error)}`,
        );
        setLoading(false);
        return;
      }

      if (invRes.error) {
        console.error('[vendors] invoices error:', invRes.error);
      }

      console.log('[vendors] extractions:', exRes.data?.length ?? 0);
      console.log('[vendors] invoices:', invRes.data?.length ?? 0);

      const statusMap: Record<string, string> = {};
      for (const inv of (invRes.data ?? []) as RawInvoice[]) {
        statusMap[inv.id] = inv.status;
      }

      setExtractions((exRes.data ?? []) as RawExtraction[]);
      setInvoiceStatus(statusMap);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const vendors: VendorRow[] = useMemo(() => {
    const map = new Map<string, VendorRow>();

    for (const ex of extractions) {
      const displayName = (ex.vendor_name || '').trim();
      if (!displayName) continue;

      // Group case-insensitively so "ACME Inc." and "acme inc" merge
      const key = displayName.toLowerCase();

      const existing = map.get(key);
      const conf =
        typeof ex.vendor_confidence === 'number' ? ex.vendor_confidence : null;

      const invoiceEntry = {
        id: ex.invoice_id ?? ex.id,
        invoiceNumber: ex.invoice_number ?? '—',
        date: ex.invoice_date ?? ex.extracted_at ?? null,
        amount: ex.amount ?? null,
        currency: ex.currency ?? 'USD',
        status: invoiceStatus[ex.invoice_id] ?? 'unknown',
        confidence: conf ?? 0,
      };

      if (existing) {
        existing.invoiceCount += 1;
        existing.confSum += conf ?? 0;
        existing.confCount += conf != null ? 1 : 0;
        existing.invoices.push(invoiceEntry);
        const latest = ex.extracted_at ?? '';
        if (latest > (existing.lastSeenIso ?? '')) {
          existing.lastSeenIso = latest;
        }
      } else {
        map.set(key, {
          id: key,
          name: displayName,
          aliases: [],
          invoiceCount: 1,
          confSum: conf ?? 0,
          confCount: conf != null ? 1 : 0,
          avgConfidence: 0,
          lastSeenIso: ex.extracted_at ?? null,
          lastSeen: '',
          invoices: [invoiceEntry],
        });
      }
    }

    const list = Array.from(map.values());
    for (const v of list) {
      v.avgConfidence = v.confCount > 0 ? v.confSum / v.confCount : 0;
      v.lastSeen = timeAgo(v.lastSeenIso);
    }

    list.sort((a, b) => {
      if (b.invoiceCount !== a.invoiceCount)
        return b.invoiceCount - a.invoiceCount;
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [extractions, invoiceStatus]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.aliases.some((a) => a.toLowerCase().includes(q)),
    );
  }, [vendors, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const aliasReviewCount = vendors.filter((v) => v.aliases.length === 0).length;

  return (
    <div className="flex h-screen bg-[#FCFCFA] text-neutral-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-neutral-200 px-8 pt-6 pb-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Vendors
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                {vendors.length} vendors · {aliasReviewCount} pending alias review
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
                  placeholder="Search vendors or aliases…"
                  className="w-80 rounded-full border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/5"
                />
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
              >
                <Plus className="h-4 w-4" />
                Add vendors
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {loading ? (
              <p className="py-24 text-center text-sm text-neutral-400">
                Loading…
              </p>
            ) : errorMsg ? (
              <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <strong>Failed to load:</strong> {errorMsg}
              </div>
            ) : (
              <VendorsTable rows={pageRows} />
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