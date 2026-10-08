// app/rules/RulesContent.tsx
'use client';

import { useState } from 'react';
import { Eye, Info } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { RulesSlider } from '@/components/RulesSlider';
import { RulesNumberInput } from '@/components/RulesNumberInput';
import { SeverityBand } from '@/components/SeverityBand';

export function RulesContent() {
  const [autoReconcile, setAutoReconcile] = useState(0.87);
  const [reviewAbove, setReviewAbove] = useState(0.65);
  const [absTolerance, setAbsTolerance] = useState('1.00');
  const [relTolerance, setRelTolerance] = useState('0.1');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function saveChanges() {
    setSaving(true);
    // TODO: persist to supabase `settings` table
    console.log('[rules] save', {
      autoReconcile,
      reviewAbove,
      absTolerance,
      relTolerance,
    });
    setTimeout(() => {
      setSaving(false);
      setSavedAt(Date.now());
    }, 400);
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
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-8 py-6">
          {/* ── Card 1: Reconciliation thresholds ─────── */}
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
              <div>
                <RulesSlider
                  label="Auto-reconcile above"
                  value={autoReconcile}
                  onChange={setAutoReconcile}
                  helper="Invoices above this confidence move directly to reconciled."
                />
              </div>

              <div className="border-t border-neutral-100" />

              <div>
                <RulesSlider
                  label="Review above"
                  value={reviewAbove}
                  onChange={setReviewAbove}
                  helper="Invoices between this and the auto-reconcile threshold go to the review queue."
                />
              </div>
            </div>
          </section>

          {/* ── Card 2: Amount tolerance ──────────────── */}
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
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-600"
                aria-label="Preview rule"
              >
                <Eye className="h-4 w-4" />
              </button>
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

          {/* ── Card 3: Severity bands ────────────────── */}
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
                Changes apply to new invoices processed after saving. Existing
                matches are not re-evaluated.
              </span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}