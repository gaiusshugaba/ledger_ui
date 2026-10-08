// app/queue/QueueContent.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { QueueHeader } from '@/components/QueueHeader';
import { QueueRow, type QueueInvoice } from '@/components/QueueRow';
import { normalizeInvoice } from '@/lib/normalizeInvoice';
import { createClient } from '@/lib/supabase/client';
import { useCounts } from '@/lib/CountsContext';

type Tab = 'All' | 'Review' | 'Exceptions';

const CURRENT_ACTOR = 'G. Gana';

export function QueueContent() {
  const [tab, setTab] = useState<Tab>('All');
  const [query, setQuery] = useState('');
  const [invoices, setInvoices] = useState<QueueInvoice[]>([]);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { refresh: refreshCounts } = useCounts();

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

      setInvoices((data ?? []).map(normalizeInvoice));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleApprove(id: string) {
    const current = invoices.find((i) => i.id === id);
    if (!current) return;

    setBusyIds((s) => new Set(s).add(id));
    setInvoices((prev) => prev.filter((i) => i.id !== id));

    const supabase = createClient();
    const now = new Date().toISOString();

    const { error: updErr } = await supabase
      .from('invoices')
      .update({ status: 'reconciled', processed_at: now, updated_at: now })
      .eq('id', id);

    if (updErr) {
      console.error('[queue] approve failed:', updErr);
      setInvoices((prev) => [current, ...prev]);
      setToast('Failed to approve — check console');
    } else {
      const { error: auditErr } = await supabase.from('audit_log').insert({
        actor: CURRENT_ACTOR,
        action: 'invoice_reconciled',
        entity_type: 'invoice',
        entity_id: current.invoiceNumber,
        reason: 'Approved from review queue',
        metadata: {
          invoice_id: id,
          amount: current.amount,
          vendor: current.company,
        },
      });
      if (auditErr) {
        console.warn('[queue] audit insert failed:', auditErr);
      }
      setToast(`Approved ${current.invoiceNumber}`);
      refreshCounts();
    }

    setBusyIds((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

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
            <p className="py-16 text-center text-sm text-neutral-400">
              Loading…
            </p>
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
              <QueueRow
                key={invoice.id}
                invoice={invoice}
                busy={busyIds.has(invoice.id)}
                onApprove={handleApprove}
              />
            ))
          )}
        </div>

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg">
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}