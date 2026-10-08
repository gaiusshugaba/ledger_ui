// components/AutomatedChecks.tsx
'use client';

import { Check, AlertTriangle, ChevronUp } from 'lucide-react';

type CheckItem = {
  label: string;
  status: 'passed' | 'flagged';
};

export function AutomatedChecks({ checks }: { checks: readonly CheckItem[] }) {
  const passed = checks.filter((c) => c.status === 'passed').length;
  const total = checks.length;

  return (
    <div className="rounded-xl bg-white ring-1 ring-neutral-200">
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
        {checks.map((c, i) => (
          <li key={i} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              {c.status === 'passed' ? (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#DEF7EC]">
                  <Check className="h-3.5 w-3.5 text-[#03543F]" strokeWidth={3} />
                </div>
              ) : (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7]">
                  <AlertTriangle className="h-3.5 w-3.5 text-[#92400E]" strokeWidth={2.5} />
                </div>
              )}
              <span className="truncate text-[13px] text-neutral-700">{c.label}</span>
            </div>
            <span
              className={`shrink-0 text-[11px] font-semibold uppercase tracking-wider ${
                c.status === 'passed' ? 'text-emerald-700' : 'text-[#92400E]'
              }`}
            >
              {c.status === 'passed' ? 'Passed' : 'Flagged'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}