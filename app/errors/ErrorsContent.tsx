// app/errors/ErrorsContent.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ErrorsTable, type ErrorRow } from '@/components/ErrorsTable';
import { ReconciledPagination } from '@/components/ReconciledPagination';
import { createClient } from '@/lib/supabase/client';

const PAGE_SIZE = 9;

type RawError = {
  id: string;
  created_at: string | null;
  pipeline: string | null;
  step: string | null;
  error_type: string | null;
  error_message: string | null;
  severity: string | null;
  resolved: boolean | null;
  invoice_id: string | null;
};

export function ErrorsContent() {
  const [rows, setRows] = useState<ErrorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const { data, error } = await supabase
        .from('errors')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(500);

      if (cancelled) return;

      if (error) {
        console.error('[errors] supabase error:', error);
        setErrorMsg(`${error.message} (${error.code})`);
        setLoading(false);
        return;
      }

      console.log('[errors] rows:', data?.length ?? 0);
      console.log('[errors] first row:', JSON.stringify(data?.[0], null, 2));

      setRows((data ?? []).map(normalizeRow));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice(
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
                Pipeline Errors
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                {rows.length} unresolved
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            {loading ? (
              <p className="py-24 text-center text-sm text-neutral-400">Loading…</p>
            ) : errorMsg ? (
              <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <strong>Failed to load:</strong> {errorMsg}
              </div>
            ) : (
              <ErrorsTable rows={pageRows} />
            )}

            <ReconciledPagination
              total={rows.length}
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

// ── Helpers ────────────────────────────────────────────
function normalizeRow(raw: RawError): ErrorRow {
  return {
    id: raw.id,
    timestamp: formatTimestamp(raw.created_at),
    pipeline: raw.pipeline ?? '—',
    step: raw.step ?? '—',
    errorType: raw.error_type ?? '—',
    errorMessage: raw.error_message ?? '—',
    severity: normalizeSeverity(raw.severity),
  };
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function normalizeSeverity(s: string | null): 'critical' | 'warning' | 'info' {
  const v = (s ?? '').toLowerCase();
  if (v === 'critical' || v === 'error' || v === 'fatal') return 'critical';
  if (v === 'warning' || v === 'warn') return 'warning';
  return 'info';
}