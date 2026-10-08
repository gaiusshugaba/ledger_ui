// app/audit/AuditContent.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { FilterDropdown } from '@/components/FilterDropdown';
import { AuditLogTable, type AuditLogEntry } from '@/components/AuditLogTable';
import { AuditPagination } from '@/components/AuditPagination';
import { createClient } from '@/lib/supabase/client';

const PAGE_SIZE = 8;

const DATE_RANGES = [
  'Last 24 hours',
  'Last 7 days',
  'Last 30 days',
  'Last 90 days',
  'All time',
];

type RawAudit = {
  id: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_state: any;
  after_state: any;
  reason: string | null;
  metadata: any;
  created_at: string;
};

export function AuditContent() {
  const [raw, setRaw] = useState<RawAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState('Last 30 days');
  const [actorFilter, setActorFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [entityFilter, setEntityFilter] = useState('All');

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2000);

      if (cancelled) return;

      if (error) {
        console.error('[audit] supabase error:', error);
        setErrorMsg(`audit_log: ${error.message || JSON.stringify(error)}`);
        setLoading(false);
        return;
      }

      console.log('[audit] rows:', data?.length ?? 0);
      console.log('[audit] first row:', JSON.stringify(data?.[0], null, 2));

      setRaw((data ?? []) as RawAudit[]);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Normalize rows ──────────────────────────────────────
  const rows: AuditLogEntry[] = useMemo(
    () =>
      raw.map((r) => ({
        id: r.id,
        timestamp: formatTimestamp(r.created_at),
        rawTimestamp: r.created_at,
        actor: r.actor || 'system',
        actorType: r.actor.toLowerCase() === 'system' ? 'system' : 'user',
        action: r.action || 'unknown',
        entityType: r.entity_type || '',
        entityId: r.entity_id || '',
        details: r.reason || metadataString(r.metadata) || '',
        before: r.before_state ?? null,
        after: r.after_state ?? null,
      })),
    [raw],
  );

  // ── Filter options derived from data ────────────────────
  const actorOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.actor);
    return ['All', ...Array.from(set).sort()];
  }, [rows]);

  const actionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.action);
    return ['All', ...Array.from(set).sort()];
  }, [rows]);

  const entityOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.entityType) set.add(r.entityType);
    return ['All', ...Array.from(set).sort()];
  }, [rows]);

  // ── Apply filters ───────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    const msPerRange: Record<string, number> = {
      'Last 24 hours': 24 * 60 * 60 * 1000,
      'Last 7 days': 7 * 24 * 60 * 60 * 1000,
      'Last 30 days': 30 * 24 * 60 * 60 * 1000,
      'Last 90 days': 90 * 24 * 60 * 60 * 1000,
      'All time': Infinity,
    };
    const cutoff = msPerRange[dateRange] ?? Infinity;

    return rows.filter((r) => {
      if (actorFilter !== 'All' && r.actor !== actorFilter) return false;
      if (actionFilter !== 'All' && r.action !== actionFilter) return false;
      if (entityFilter !== 'All' && r.entityType !== entityFilter) return false;
      if (cutoff !== Infinity && r.rawTimestamp) {
        const t = new Date(r.rawTimestamp).getTime();
        if (!Number.isFinite(t) || now - t > cutoff) return false;
      }
      if (q) {
        const hay = `${r.actor} ${r.action} ${r.entityType} ${r.entityId} ${r.details}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, actorFilter, actionFilter, entityFilter, dateRange, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="flex h-screen bg-[#FCFCFA] text-neutral-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-neutral-200 px-8 pt-6 pb-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Audit log
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                {filtered.length.toLocaleString()} events this month
              </p>
            </div>

            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setPage(1);
                }}
                className="appearance-none rounded-full border border-neutral-200 bg-white py-2 pl-4 pr-10 text-sm font-medium text-neutral-800 shadow-sm focus:border-neutral-400 focus:outline-none"
              >
                {DATE_RANGES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Filter bar */}
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FilterDropdown
                label="Actor"
                value={actorFilter}
                options={actorOptions}
                onChange={(v) => {
                  setActorFilter(v);
                  setPage(1);
                }}
              />
              <FilterDropdown
                label="Action"
                value={actionFilter}
                options={actionOptions}
                onChange={(v) => {
                  setActionFilter(v);
                  setPage(1);
                }}
              />
              <FilterDropdown
                label="Entity"
                value={entityFilter}
                options={entityOptions}
                onChange={(v) => {
                  setEntityFilter(v);
                  setPage(1);
                }}
              />
            </div>

            <div className="relative w-[360px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search events, actors, entities…"
                className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/5"
              />
            </div>
          </div>

          {/* Table */}
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
              <AuditLogTable rows={pageRows} />
            )}

            <AuditPagination
              total={filtered.length}
              page={currentPage}
              pageSize={PAGE_SIZE}
              totalPages={totalPages}
              onPageChange={setPage}
              noun="events"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '—';
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${hh}:${mm}`;
}

function metadataString(m: any): string {
  if (m == null) return '';
  if (typeof m === 'string') return m;
  if (typeof m === 'object') {
    const keys = Object.keys(m);
    if (keys.length === 0) return '';
    return keys
      .slice(0, 3)
      .map((k) => `${k}: ${JSON.stringify(m[k])}`)
      .join(' · ');
  }
  return String(m);
} 