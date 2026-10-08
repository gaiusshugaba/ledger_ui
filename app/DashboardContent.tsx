// app/DashboardContent.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Calendar as CalendarIcon,
  Plus,
  FileText,
  ClipboardCheck,
  FileWarning,
  AlertOctagon,
  SlidersHorizontal,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { KpiCard } from '@/components/KpiCard';
import { ActivityRow, type ActivityInvoice } from '@/components/ActivityRow';
import { createClient } from '@/lib/supabase/client';
import type { Status } from '@/components/QueueRow';

type Tab = 'All' | 'Reconciled' | 'Flagged';

type RawInvoice = {
  id: string;
  status: string;
  created_at: string | null;
  uploaded_at: string | null;
  processed_at: string | null;
  extraction: any;
  match: any;
};

export function DashboardContent() {
  const [tab, setTab] = useState<Tab>('All');
  const [query, setQuery] = useState('');
  const [raw, setRaw] = useState<RawInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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
      uploaded_at,
      processed_at,
      extraction:extractions(vendor_name, invoice_number, amount, currency, line_items),
      match:matches(tier_reason)
    `)
    .order('created_at', { ascending: false })
    .limit(200);
    
      if (cancelled) return;

      if (error) {
        console.error('[dashboard] supabase error:', error);
        setErrorMsg(`${error.message} (${error.code})`);
        setLoading(false);
        return;
      }

      console.log('[dashboard] rows:', data?.length ?? 0);
      console.log('[dashboard] first row:', JSON.stringify(data?.[0], null, 2));

      setRaw((data ?? []) as RawInvoice[]);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Derived data ─────────────────────────────────────────
  const kpis = useMemo(() => {
    let total = 0;
    let reconciled = 0;
    let review = 0;
    let exception = 0;
    let recCount = 0;
    let revCount = 0;
    let excCount = 0;

    for (const r of raw) {
      const ex = Array.isArray(r.extraction) ? r.extraction[0] : r.extraction;
      const amt = Number(ex?.amount ?? 0) || 0;
      total += amt;
      const s = (r.status || '').toLowerCase();
      if (s === 'reconciled' || s === 'paid') {
        reconciled += amt;
        recCount++;
      } else if (s === 'exception') {
        exception += amt;
        excCount++;
      } else if (s === 'review_required' || s === 'review') {
        review += amt;
        revCount++;
      }
    }

    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

    return {
      total,
      reconciled,
      review,
      exception,
      recCount,
      revCount,
      excCount,
      recPct: pct(reconciled),
      revPct: pct(review),
      excPct: pct(exception),
      processedThisWeek: raw.filter((r) => r.processed_at).length,
      activeCount: raw.filter((r) => {
        const s = (r.status || '').toLowerCase();
        return s === 'exception' || s === 'review_required' || s === 'review';
      }).length,
    };
  }, [raw]);

  // ── Activity rows (top 6) ────────────────────────────────
  const activityRows: ActivityInvoice[] = useMemo(() => {
    return raw.slice(0, 6).map((r) => {
      const ex = Array.isArray(r.extraction) ? r.extraction[0] : r.extraction;
      const match = Array.isArray(r.match) ? r.match[0] : r.match;

      const reasons: string[] = [];
      if (match?.tier_reason) reasons.push(String(match.tier_reason));

      const createdIso = r.created_at ?? r.uploaded_at;
      const due = createdIso
        ? new Date(new Date(createdIso).getTime() + 30 * 24 * 60 * 60 * 1000)
        : null;

      return {
        id: r.id,
        vendor: ex?.vendor_name || '—',
        invoiceNumber: ex?.invoice_number || '—',
        amount: formatMoney(ex?.amount, ex?.currency),
        dueDate: due
          ? due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : '—',
        status: normalizeStatus(r.status),
        age: timeAgo(createdIso),
        reasons,
      };
    });
  }, [raw]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activityRows.filter((r) => {
      if (tab === 'Reconciled' && r.status !== 'Reconciled') return false;
      if (tab === 'Flagged' && r.status !== 'Exception' && r.status !== 'Review')
        return false;
      if (!q) return true;
      return (
        r.vendor.toLowerCase().includes(q) ||
        r.invoiceNumber.toLowerCase().includes(q)
      );
    });
  }, [tab, query, activityRows]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex h-screen bg-[#FCFCFA] text-neutral-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-neutral-200 px-8 pt-6 pb-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                {kpis.activeCount} active invoices · {kpis.processedThisWeek} processed this week
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Invoice, vendor, SKU…"
                  className="w-80 rounded-full border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/5"
                />
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                Mon, Sep 21
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
              >
                <Plus className="h-4 w-4" />
                Add invoice
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-4">
            <KpiCard
              label="Total Value"
              value={formatCompactMoney(kpis.total)}
              caption={`${raw.length} invoices · Last 7 days`}
              icon={FileText}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
            />
            <KpiCard
              label="Reconciled"
              value={formatCompactMoney(kpis.reconciled)}
              caption={`${kpis.recPct}% of value · ${kpis.recCount} invoices`}
              icon={ClipboardCheck}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <KpiCard
              label="Review Required"
              value={formatCompactMoney(kpis.review)}
              caption={`${kpis.revPct}% of value · ${kpis.revCount} invoices`}
              icon={FileWarning}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />
            <KpiCard
              label="Exceptions"
              value={formatCompactMoney(kpis.exception)}
              caption={`${kpis.excPct}% of value · ${kpis.excCount} invoices`}
              icon={AlertOctagon}
              iconBg="bg-red-50"
              iconColor="text-red-600"
            />
          </div>

          {/* Recent activity */}
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">
                  Recent Activity
                </h2>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Last 5 processed invoices ~ Click row to inspect AI reasoning
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-1 rounded-full bg-neutral-100 p-1">
                  {(['All', 'Reconciled', 'Flagged'] as Tab[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                        tab === t
                          ? 'bg-neutral-900 text-white'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filter
                </button>
              </div>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[44px_1fr_140px_160px_140px_120px_180px] items-center gap-4 border-y border-neutral-100 bg-neutral-50/60 px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              <span />
              <span>Invoice</span>
              <span className="text-right">Amount</span>
              <span>Due Date</span>
              <span>Status</span>
              <span>Age</span>
              <span className="text-right">Actions</span>
            </div>

            {loading ? (
              <p className="py-16 text-center text-sm text-neutral-400">
                Loading…
              </p>
            ) : errorMsg ? (
              <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <strong>Failed to load:</strong> {errorMsg}
              </div>
            ) : filteredRows.length === 0 ? (
              <p className="py-16 text-center text-sm text-neutral-400">
                No invoices to show.
              </p>
            ) : (
              <div>
                {filteredRows.map((inv) => (
                  <ActivityRow
                    key={inv.id}
                    invoice={inv}
                    expanded={expanded.has(inv.id)}
                    onToggle={() => toggle(inv.id)}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3 text-xs text-neutral-500">
              <span>
                Showing {filteredRows.length} of {raw.length}
              </span>
              <a
                href="/queue"
                className="inline-flex items-center gap-1 font-medium text-neutral-700 hover:text-neutral-900"
              >
                View all in review queue →
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────
function normalizeStatus(s: string | null | undefined): Status {
  const v = (s ?? '').toLowerCase();
  if (v.startsWith('exc')) return 'Exception';
  if (v === 'review_required' || v.startsWith('rev')) return 'Review';
  if (v.startsWith('app')) return 'Approved';
  if (v.startsWith('paid') || v.startsWith('recon')) return 'Reconciled';
  return 'Review';
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

function formatCompactMoney(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
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