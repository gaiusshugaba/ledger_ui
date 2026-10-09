// components/AuditHistoryModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { X, Clock, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  reason: string | null;
  created_at: string;
  before_state: any;
  after_state: any;
};

export function AuditHistoryModal({
  invoiceId,
  invoiceNumber,
  onClose,
}: {
  invoiceId: string;
  invoiceNumber: string | null;
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .or(
          `entity_id.eq.${invoiceNumber || 'NONE'},metadata->>invoice_id.eq.${invoiceId}`,
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (cancelled) return;

      if (error) {
        console.error('[audit-history] load failed:', error);
      }

      setEntries((data ?? []) as AuditEntry[]);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [invoiceId, invoiceNumber]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-neutral-500" />
            <h2 className="text-base font-semibold text-neutral-900">
              Audit history
            </h2>
            {invoiceNumber && (
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 font-mono text-[11px] text-neutral-600">
                {invoiceNumber}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-neutral-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : entries.length === 0 ? (
            <p className="py-12 text-center text-sm text-neutral-400">
              No audit entries for this invoice yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {entries.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <div className="relative flex w-3 shrink-0 justify-center">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-neutral-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-mono text-[12px] font-medium text-neutral-900">
                        {e.action}
                      </p>
                      <p className="shrink-0 text-[11px] text-neutral-400">
                        {formatTime(e.created_at)}
                      </p>
                    </div>
                    <p className="mt-0.5 text-[12px] text-neutral-600">
                      by {e.actor}
                    </p>
                    {e.reason && (
                      <p className="mt-1 text-[12px] text-neutral-500">
                        {e.reason}
                      </p>
                    )}
                    {e.before_state && e.after_state && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-[11px] text-neutral-500 hover:text-neutral-700">
                          Show diff
                        </summary>
                        <pre className="mt-2 overflow-x-auto rounded-lg bg-neutral-50 p-3 text-[11px] text-neutral-700">
                          {JSON.stringify(
                            { before: e.before_state, after: e.after_state },
                            null,
                            2,
                          )}
                        </pre>
                      </details>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-neutral-100 px-6 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
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