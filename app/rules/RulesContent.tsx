// app/rules/RulesContent.tsx
'use client';

import { useEffect, useState } from 'react';
import { Eye, Info, Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { RulesSlider } from '@/components/RulesSlider';
import { RulesNumberInput } from '@/components/RulesNumberInput';
import { SeverityBand } from '@/components/SeverityBand';
import { createClient } from '@/lib/supabase/client';

const DEFAULT_THRESHOLDS = { auto: 0.87, review: 0.65 };
const DEFAULT_TOLERANCE = { absolute: 1.0, relative: 0.001 };

export function RulesContent() {
  const [autoReconcile, setAutoReconcile] = useState(DEFAULT_THRESHOLDS.auto);
  const [reviewAbove, setReviewAbove] = useState(DEFAULT_THRESHOLDS.review);
  const [absTolerance, setAbsTolerance] = useState(
    DEFAULT_TOLERANCE.absolute.toFixed(2),
  );
  const [relTolerance, setRelTolerance] = useState(
    (DEFAULT_TOLERANCE.relative * 100).toString(),
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (cancelled) return;

      if (error) {
        console.error('[rules] load failed:', error);
        setErrorMsg('Failed to load settings');
        setLoading(false);
        return;
      }

      const map: Record<string, any> = {};
      for (const row of data ?? []) map[row.key] = row.value;

      if (map['matching.thresholds']) {
        setAutoReconcile(
          Number(map['matching.thresholds'].auto ?? DEFAULT_THRESHOLDS.auto),
        );
        setReviewAbove(
          Number(map['matching.thresholds'].review ?? DEFAULT_THRESHOLDS.review),
        );
      }

      if (map['matching.amount_tolerance']) {
        const abs = Number(
          map['matching.amount_tolerance'].absolute ?? DEFAULT_TOLERANCE.absolute,
        );
        const rel = Number(
          map['matching.amount_tolerance'].relative ?? DEFAULT_TOLERANCE.relative,
        );
        setAbsTolerance(abs.toFixed(2));
        setRelTolerance((rel * 100).toString());
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveChanges() {
    setSaving(true);
    setErrorMsg(null);

    const supabase = createClient();

    const absNum = Number(absTolerance) || 0;
    const relPct = Number(relTolerance) || 0;
    const relNum = relPct / 100;

    const { error } = await supabase.from('settings').upsert([
      {
        key: 'matching.thresholds',
        value: { auto: autoReconcile, review: reviewAbove },
        updated_at: new Date().toISOString(),
      },
      {
        key: 'matching.amount_tolerance',
        value: { absolute: absNum, relative: relNum },
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('[rules] save failed:', error);
      setErrorMsg(error.message || 'Save failed');
      setSaving(false);
      return;
    }

    setSaving(false);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-[#FCFCFA]">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center text-sm text-neutral-400">
          Loading rules…
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FCFCFA] text-neutral-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-neutral-200 px-8 pt-6 pb-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Rules
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                How Ledger decides what needs review
              </p>
            </div>

            <div className="flex items-center gap-3">
              {savedAt && !saving && (
                <span className="text-xs text-emerald-600">Saved</span>
              )}
              <button
                type="button"
                onClick={saveChanges}
                disabled={saving}
                className="inline-flex items-center rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-8 py-6">
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <strong>Error:</strong> {errorMsg}
            </div>
          )}

          <section className="rounded-2xl border border-neutral-200 bg-white p-6">
            <header className="mb-6">
              <h2 className="text-base font-semibold text-neutral-900">
                Reconciliation thresholds
              </h2>
              <p className="mt-0.5 text-sm text-neutral-500">
                Confidence thresholds for tier classification
              </p>
            </header>

            <div className="space-y-6">
              <RulesSlider
                label="Auto-reconcile above"
                value={autoReconcile}
                onChange={setAutoReconcile}
                helper="Invoices above this confidence move directly to reconciled."
              />

              <div className="border-t border-neutral-100" />

              <RulesSlider
                label="Review above"
                value={reviewAbove}
                onChange={setReviewAbove}
                helper="Invoices between this and the auto-reconcile threshold go to the review queue."
              />
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6">
            <header className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">
                  Amount tolerance
                </h2>
                <p className="mt-0.5 text-sm text-neutral-500">
                  Rounding rules for amount matching
                </p>
              </div>
              <RulePreviewPopover
                title="Amount tolerance"
                body="When the difference between an invoice amount and its matched PO falls under the absolute or relative threshold, the variance is treated as rounding noise and does not affect the match confidence score."
              />
            </header>

            <div className="grid grid-cols-2 gap-4">
              <RulesNumberInput
                label="Absolute tolerance"
                prefix="USD"
                value={absTolerance}
                onChange={setAbsTolerance}
                helper="Amount differences under this are treated as rounding variance."
                step="0.01"
              />
              <RulesNumberInput
                label="Relative tolerance"
                suffix="%"
                value={relTolerance}
                onChange={setRelTolerance}
                helper="Amount differences under this percentage are treated as minor variance."
                step="0.1"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6">
            <header className="mb-5">
              <h2 className="text-base font-semibold text-neutral-900">
                Severity bands
              </h2>
              <p className="mt-0.5 text-sm text-neutral-500">
                How differences are prioritized in the exception queue
              </p>
            </header>

            <div className="divide-y divide-neutral-100">
              <SeverityBand
                tone="low"
                label="Low"
                title="Amount differs by less than $1.00"
                description="Queued for low-priority batch review; automatic approval eligible under safe vendor profiles."
              />
              <SeverityBand
                tone="medium"
                label="Medium"
                title="Amount differs by 0.1% to 5%"
                description="Requires single finance team lead sign-off in the triage queue."
              />
              <SeverityBand
                tone="high"
                label="High"
                title="Missing PO, duplicate, or amount differs by more than 5%"
                description="Reconciliation locked; requires manual override or vendor clarification."
              />
            </div>

            <div className="mt-6 flex items-start gap-2 rounded-xl bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
              <span>
                Changes apply to new invoices processed after saving. The n8n
                match engine reads these values on each pipeline run.
              </span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function RulePreviewPopover({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest('[data-rule-preview]')) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="relative" data-rule-preview>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-600"
        aria-label="Preview rule"
      >
        <Eye className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-xl border border-neutral-200 bg-white p-4 shadow-lg">
          <p className="text-xs font-semibold text-neutral-900">{title}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">
            {body}
          </p>
        </div>
      )}
    </div>
  );
}