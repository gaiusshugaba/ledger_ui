// app/queue/QueueContent.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { QueueHeader } from '@/components/QueueHeader';
import { QueueRow, type QueueInvoice } from '@/components/QueueRow';
import { normalizeInvoice } from '@/lib/normalizeInvoice';
import { createClient } from '@/lib/supabase/client';

type Tab = 'All' | 'Review' | 'Exceptions';

export function QueueContent() {
  const [tab, setTab] = useState<Tab>('All');
  const [query, setQuery] = useState('');
  const [invoices, setInvoices] = useState<QueueInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          extraction:extractions(*),
          match:matches(*)
        `)
        .in('status', ['review_required', 'exception'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (cancelled) return;

      if (error) {
        console.error('[queue] supabase error:', error);
        setErrorMsg(`${error.message} (code: ${error.code})`);
        setLoading(false);
        return;
      }

      console.log('[queue] row count:', data?.length ?? 0);
      console.log('[queue] first joined row:', JSON.stringify(data?.[0], null, 2));

      setInvoices((data ?? []).map(normalizeInvoice));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (tab === 'Review' && inv.status !== 'Review') return false;
      if (tab === 'Exceptions' && inv.status !== 'Exception') return false;
      if (!q) return true;
      return (
        inv.company.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.reason ?? '').toLowerCase().includes(q)
      );
    });
  }, [tab, query, invoices]);

  const counts: Record<Tab, number> = {
    All: invoices.length,
    Review: invoices.filter((i) => i.status === 'Review').length,
    Exceptions: invoices.filter((i) => i.status === 'Exception').length,
  };

  return (
    <div className="flex h-screen bg-[#FCFCFA] text-neutral-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <QueueHeader
          activeTab={tab}
          onTabChange={setTab}
          counts={counts}
          query={query}
          onQueryChange={setQuery}
        />
        <div className="space-y-3 px-8 py-6">
          {loading ? (
            <p className="py-16 text-center text-sm text-neutral-400">Loading…</p>
          ) : errorMsg ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <strong>Failed to load:</strong> {errorMsg}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-neutral-400">
              No invoices match your filters.
            </p>
          ) : (
            filtered.map((invoice) => (
              <QueueRow key={invoice.id} invoice={invoice} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}