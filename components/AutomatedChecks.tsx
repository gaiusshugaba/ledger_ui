// components/AutomatedChecks.tsx
'use client';

import { Check, AlertTriangle, X, ChevronUp } from 'lucide-react';

export type CheckStatus = 'passed' | 'warning' | 'flagged';

export type CheckItem = {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
};

export function AutomatedChecks({ checks }: { checks: readonly CheckItem[] }) {
  const passed = checks.filter((c) => c.status === 'passed').length;
  const total = checks.length;

  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-neutral-900">
            Automated checks
          </span>
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
            {passed} of {total} passed
          </span>
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Collapse"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      <ul className="divide-y divide-neutral-100">
        {checks.map((c) => (
          <li key={c.id} className="flex items-start gap-3 px-4 py-3">
            <StatusIcon status={c.status} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[13px] text-neutral-700">{c.label}</span>
                <StatusBadge status={c.status} />
              </div>
              {c.detail && (
                <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">
                  {c.detail}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === 'passed') {
    return (
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#DEF7EC]">
        <Check className="h-3.5 w-3.5 text-[#03543F]" strokeWidth={3} />
      </div>
    );
  }
  if (status === 'warning') {
    return (
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7]">
        <AlertTriangle className="h-3.5 w-3.5 text-[#92400E]" strokeWidth={2.5} />
      </div>
    );
  }
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FDE8E8]">
      <X className="h-3.5 w-3.5 text-[#9B1C1C]" strokeWidth={3} />
    </div>
  );
}

function StatusBadge({ status }: { status: CheckStatus }) {
  const cls =
    status === 'passed'
      ? 'text-emerald-700'
      : status === 'warning'
      ? 'text-[#92400E]'
      : 'text-[#9B1C1C]';
  const label =
    status === 'passed' ? 'Passed' : status === 'warning' ? 'Warning' : 'Flagged';
  return (
    <span
      className={`shrink-0 text-[11px] font-semibold uppercase tracking-wider ${cls}`}
    >
      {label}
    </span>
  );
}