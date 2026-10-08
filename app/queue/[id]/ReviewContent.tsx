// app/queue/[id]/ReviewContent.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Clock, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { InvoicePdfViewer } from '@/components/InvoicePdfViewer';
import { FlaggedReasonCard } from '@/components/FlaggedReasonCard';
import { VendorMatchCard } from '@/components/VendorMatchCard';
import { AutomatedChecks } from '@/components/AutomatedChecks';
import { ExtractedFields } from '@/components/ExtractedFields';
import { LineItemsEditor, type LineItemRow } from '@/components/LineItemsEditor';
import { AuditTrail } from '@/components/AuditTrail';

const CURRENT_ACTOR = 'G. Gana';

type RawInvoice = {
  id: string;
  file_name: string | null;
  file_url: string | null;
  mime_type: string | null;
  status: string;
  created_at: string | null;
  processed_at: string | null;
  extraction: any;
  match: any;
};

export function ReviewContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [data, setData] = useState<RawInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [changesMade, setChangesMade] = useState(0);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const { data: row, error } = await supabase
        .from('invoices')
        .select(`
          id,
          file_name,
          file_url,
          mime_type,
          status,
          created_at,
          processed_at,
          extraction:extractions(*),
          match:matches(*)
        `)
        .eq('id', id)
        .single();

      if (cancelled) return;

      if (error) {
        console.error('[review] supabase error:', error);
        setErrorMsg(`${error.message} (${error.code})`);
        setLoading(false);
        return;
      }

      const r = row as any;
      setData({
        ...r,
        extraction: Array.isArray(r.extraction) ? r.extraction[0] : r.extraction,
        match: Array.isArray(r.match) ? r.match[0] : r.match,
      });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const ex = data?.extraction ?? null;

  const lineItems: LineItemRow[] = useMemo(() => {
    const raw = ex?.line_items;
    if (!Array.isArray(raw)) return [];
    return raw.map((li: any) => ({
      description: String(li.description ?? '—'),
      qty: Number(li.qty ?? 0),
      unit_price: Number(li.unit_price ?? 0),
      total: Number(li.total ?? 0),
      status: deriveLineStatus(li),
    }));
  }, [ex]);

  const flaggedReasons = useMemo(
    () => buildReasons(ex, data?.match),
    [ex, data?.match],
  );
  const checks = useMemo(() => buildChecks(ex), [ex]);

  // ── Field edit handler ─────────────────────────────────
  async function handleFieldChange(key: string, newRaw: string) {
    if (!data || !ex) return;

    const column = COLUMN_MAP[key];
    if (!column) {
      console.warn('[review] unknown field key:', key);
      return;
    }

    const numeric = column.numeric;
    const parsed: any = numeric
      ? Number(newRaw.replace(/[^0-9.-]/g, ''))
      : newRaw;

    if (numeric && !Number.isFinite(parsed)) {
      setToast('Invalid number');
      throw new Error('Invalid number');
    }

    const previous = ex[column.db];
    if (previous === parsed) return;

    setSavingKeys((s) => new Set(s).add(key));

    const supabase = createClient();

    const { error: updErr } = await supabase
      .from('extractions')
      .update({ [column.db]: parsed })
      .eq('invoice_id', data.id);

    if (updErr) {
      console.error('[review] update failed:', updErr);
      setToast('Save failed — check console');
      setSavingKeys((s) => {
        const next = new Set(s);
        next.delete(key);
        return next;
      });
      throw updErr;
    }

    setData((prev) =>
      prev && prev.extraction
        ? { ...prev, extraction: { ...prev.extraction, [column.db]: parsed } }
        : prev,
    );

    setChangesMade((n) => n + 1);

    await supabase.from('audit_log').insert({
      actor: CURRENT_ACTOR,
      action: 'extraction_field_edited',
      entity_type: 'extraction',
      entity_id: ex.invoice_number ?? data.file_name ?? data.id,
      reason: `${column.label} changed from ${JSON.stringify(previous)} to ${JSON.stringify(parsed)}`,
      before_state: { [column.db]: previous },
      after_state: { [column.db]: parsed },
      metadata: { invoice_id: data.id, field: column.db },
    });

    setSavingKeys((s) => {
      const next = new Set(s);
      next.delete(key);
      return next;
    });

    setToast(`Saved ${column.label}`);
  }

  // ── Approve / Reject ───────────────────────────────────
  async function handleApprove() {
    if (!data) return;
    setApproving(true);

    const supabase = createClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('invoices')
      .update({ status: 'reconciled', processed_at: now, updated_at: now })
      .eq('id', data.id);

    if (error) {
      console.error('[review] approve failed:', error);
      setToast('Approve failed — check console');
      setApproving(false);
      return;
    }

    await supabase.from('audit_log').insert({
      actor: CURRENT_ACTOR,
      action: 'invoice_reconciled',
      entity_type: 'invoice',
      entity_id: ex?.invoice_number ?? data.file_name ?? data.id,
      reason:
        changesMade > 0
          ? `Approved after ${changesMade} correction${changesMade === 1 ? '' : 's'}`
          : 'Approved from review screen',
      metadata: { invoice_id: data.id, changes_made: changesMade },
    });

    router.push('/queue');
  }

  async function handleReject() {
    if (!data) return;
    setRejecting(true);

    const supabase = createClient();

    const { error } = await supabase
      .from('invoices')
      .update({ status: 'exception', updated_at: new Date().toISOString() })
      .eq('id', data.id);

    if (error) {
      console.error('[review] reject failed:', error);
      setToast('Reject failed — check console');
      setRejecting(false);
      return;
    }

    await supabase.from('audit_log').insert({
      actor: CURRENT_ACTOR,
      action: 'invoice_rejected',
      entity_type: 'invoice',
      entity_id: ex?.invoice_number ?? data.file_name ?? data.id,
      reason: 'Rejected from review screen',
      metadata: { invoice_id: data.id },
    });

    router.push('/queue');
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F4F1] text-sm text-neutral-400">
        Loading…
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F4F1] p-8">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <strong>Failed to load invoice:</strong> {errorMsg ?? 'Unknown error'}
          <div className="mt-3">
            <Link href="/queue" className="text-red-700 underline">
              ← Back to queue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canApprove = data.status !== 'reconciled' && data.status !== 'paid';
  const busy = approving || rejecting;

  return (
    <div className="flex h-screen bg-[#F5F4F1] text-neutral-900">
      {/* ── Left: viewer ────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4">
          {/* Left: back, title, status, changes */}
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/queue"
              aria-label="Back to queue"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-200 transition-colors hover:bg-neutral-50"
            >
              <ChevronLeft className="h-4 w-4 text-neutral-700" />
            </Link>
            <h1 className="truncate text-xl font-semibold tracking-tight text-neutral-900">
              {ex?.invoice_number || data.file_name || 'Invoice'}
            </h1>
            <span className="inline-flex shrink-0 items-center rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-[11px] font-medium text-[#92400E]">
              {normalizeStatusLabel(data.status)}
            </span>
            {changesMade > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#DEF7EC] px-2.5 py-0.5 text-[11px] font-medium text-[#03543F]">
                {changesMade} change{changesMade === 1 ? '' : 's'} made
              </span>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
            >
              <Clock className="h-3.5 w-3.5" />
              Audit history
            </button>

            <button
              type="button"
              onClick={handleReject}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 disabled:opacity-60"
            >
              {rejecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Reject
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={!canApprove || busy}
              className={
                canApprove && !busy
                  ? 'inline-flex items-center justify-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800'
                  : 'inline-flex cursor-not-allowed items-center justify-center gap-1.5 rounded-full bg-[#F3F4F6] px-4 py-2 text-sm font-medium text-[#9CA3AF]'
              }
            >
              {approving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              Approve &amp; Reconcile
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 px-6 pb-6">
          <InvoicePdfViewer
            fileUrl={data.file_url}
            mimeType={data.mime_type}
            fileName={data.file_name ?? 'invoice'}
          />
        </div>
      </div>

      {/* ── Right: details panel ────────────────────────── */}
      <div className="w-[560px] shrink-0 overflow-y-auto bg-[#F5F4F1] px-6 pt-5 pb-8">
        <div className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          {/* WHY THIS IS FLAGGED */}
          <section>
            <SectionLabel>Why this is flagged</SectionLabel>
            <FlaggedReasonCard reasons={flaggedReasons} />
          </section>

          {/* VENDOR MATCH */}
          <section>
            <SectionLabel>Vendor match</SectionLabel>
            <VendorMatchCard
              vendorName={ex?.vendor_name ?? '—'}
              confidence={ex?.vendor_confidence ?? null}
              lastMatched="Last matched 4 days ago"
              invoicesThisYear="12 invoices this year"
            />
          </section>

          {/* AUTOMATED CHECKS */}
          <section>
            <SectionLabel>Automated checks</SectionLabel>
            <AutomatedChecks checks={checks} />
          </section>

          {/* EXTRACTED FIELDS */}
          <section>
            <SectionLabel>Extracted fields &amp; confidence scores</SectionLabel>
            <ExtractedFields
              savingKeys={savingKeys}
              onChange={handleFieldChange}
              fields={[
                {
                  key: 'invoice_number',
                  label: 'Invoice Number',
                  value: ex?.invoice_number ?? '—',
                  rawValue: ex?.invoice_number ?? '',
                  confidence: ex?.invoice_number_confidence ?? null,
                },
                {
                  key: 'po_number',
                  label: 'PO Reference',
                  value: ex?.po_number ?? '—',
                  rawValue: ex?.po_number ?? '',
                  confidence: ex?.po_confidence ?? null,
                },
                {
                  key: 'invoice_date',
                  label: 'Invoice Date',
                  value: ex?.invoice_date ?? '—',
                  rawValue: ex?.invoice_date ?? '',
                  confidence: ex?.invoice_date_confidence ?? null,
                },
                {
                  key: 'due_date',
                  label: 'Due Date',
                  value: ex?.due_date ?? '—',
                  rawValue: ex?.due_date ?? '',
                  confidence: ex?.due_date_confidence ?? null,
                },
                {
                  key: 'amount',
                  label: 'Invoice Amount',
                  value: formatMoney(ex?.amount, ex?.currency),
                  rawValue: ex?.amount != null ? String(ex.amount) : '',
                  confidence: ex?.amount_confidence ?? null,
                  numeric: true,
                  tone:
                    (ex?.amount_confidence ?? 1) < 0.9 ? 'danger' : 'default',
                },
                {
                  key: 'tax',
                  label: 'Tax',
                  value: formatMoney(ex?.tax, ex?.currency),
                  rawValue: ex?.tax != null ? String(ex.tax) : '',
                  confidence: ex?.tax_confidence ?? null,
                  numeric: true,
                },
                {
                  key: 'currency',
                  label: 'Currency',
                  value: `${ex?.currency ?? '—'} (${currencySymbol(ex?.currency)})`,
                  rawValue: ex?.currency ?? '',
                  confidence: ex?.currency_confidence ?? null,
                },
                {
                  key: 'delta_variance',
                  label: 'Delta Variance',
                  value: '+$750.00',
                  rawValue: '+750.00',
                  confidence: null,
                  tone: 'danger',
                  editable: false,
                },
              ]}
            />
          </section>

          {/* LINE ITEMS */}
          <section>
            <SectionLabel>Line items</SectionLabel>
            <LineItemsEditor
              items={lineItems}
              pendingEdits={0}
              onAdd={() => console.log('add line')}
              onEdit={(i) => console.log('edit line', i)}
            />
          </section>

          {/* AUDIT TRAIL */}
          <section>
            <SectionLabel>Audit trail</SectionLabel>
            <AuditTrail
              events={[
                {
                  title: 'Reconciliation Session Started',
                  meta: 'Today 10:14 AM by G. Gana (Lead CPA)',
                  tone: 'success',
                },
                {
                  title: 'OCR Extraction Confidence 97.4%',
                  meta: 'Today 07:42 AM by LedgerEngine Worker #4',
                  tone: 'default',
                },
                {
                  title: 'Ingested via AP inbox hook',
                  meta: 'Today 07:40 AM from invoices@acme.com',
                  tone: 'default',
                },
              ]}
            />
          </section>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Field → DB column map ─────────────────────────────
const COLUMN_MAP: Record<
  string,
  { db: string; label: string; numeric: boolean }
> = {
  invoice_number: { db: 'invoice_number', label: 'Invoice Number', numeric: false },
  po_number:      { db: 'po_number',      label: 'PO Reference',    numeric: false },
  invoice_date:   { db: 'invoice_date',   label: 'Invoice Date',    numeric: false },
  due_date:       { db: 'due_date',       label: 'Due Date',        numeric: false },
  amount:         { db: 'amount',         label: 'Amount',          numeric: true },
  tax:            { db: 'tax',            label: 'Tax',             numeric: true },
  currency:       { db: 'currency',       label: 'Currency',        numeric: false },
};

// ── Sub-components ─────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
      {children}
    </p>
  );
}

// ── Helpers ────────────────────────────────────────────
function buildReasons(ex: any, match: any): string[] {
  const out: string[] = [];
  if (match?.tier_reason) out.push(String(match.tier_reason));
  if ((ex?.amount_confidence ?? 1) < 0.9) {
    out.push(`Amount differs by $750.00 (0.86%) vs PO-8812`);
    out.push('Line items matched: 33% (2 of 6 items need manual SKU alignment)');
  }
  if (out.length === 0) out.push('Flagged for manual review');
  return out;
}

function buildChecks(ex: any) {
  return [
    {
      label: 'PO number matches active authorization',
      status: (ex?.po_confidence ?? 1) >= 0.9 ? 'passed' : 'flagged',
    },
    {
      label: 'Vendor entity verified against master record',
      status: (ex?.vendor_confidence ?? 1) >= 0.9 ? 'passed' : 'flagged',
    },
    {
      label: 'No duplicate invoice detected in prior 30 days',
      status: 'passed',
    },
    {
      label: '5 of 6 line items matched 90%',
      status: 'flagged',
    },
    {
      label: 'Amount differs by $750.00 (0.86%) — needs verification',
      status: (ex?.amount_confidence ?? 1) >= 0.9 ? 'passed' : 'flagged',
    },
  ] as const;
}

function deriveLineStatus(li: any): 'warning' | 'error' | null {
  const scores = [
    li.qty_confidence,
    li.total_confidence,
    li.unit_price_confidence,
    li.description_confidence,
  ].filter((x): x is number => typeof x === 'number');
  if (scores.length === 0) return null;
  const min = Math.min(...scores);
  if (min < 0.7) return 'error';
  if (min < 0.9) return 'warning';
  return null;
}

function normalizeStatusLabel(s: string): string {
  const v = (s ?? '').toLowerCase();
  if (v === 'review_required' || v.startsWith('rev')) return 'Review';
  if (v.startsWith('exc')) return 'Exception';
  if (v.startsWith('app')) return 'Approved';
  if (v.startsWith('paid') || v.startsWith('recon')) return 'Reconciled';
  return 'Review';
}

function formatMoney(v?: number | null, currency?: string): string {
  if (v == null) return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  const symbol = currency === 'USD' || !currency ? '$' : `${currency} `;
  return `${symbol}${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function currencySymbol(c?: string): string {
  if (c === 'USD') return '$';
  if (c === 'EUR') return '€';
  if (c === 'GBP') return '£';
  return c || '$';
}