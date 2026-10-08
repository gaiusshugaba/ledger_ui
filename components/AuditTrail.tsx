// components/AuditTrail.tsx
'use client';

import { ChevronUp } from 'lucide-react';

type Event = {
  title: string;
  meta: string;
  tone?: 'success' | 'default';
};

export function AuditTrail({ events }: { events: Event[] }) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-neutral-200">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <span className="text-sm font-medium text-neutral-900">Audit trail</span>
        <button
          type="button"
          className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Collapse"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      <ul className="px-4 py-3">
        {events.map((e, i) => (
          <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
            <div className="relative flex w-3 shrink-0 justify-center">
              <span
                className={`mt-1 h-2.5 w-2.5 rounded-full ${
                  e.tone === 'success' ? 'bg-emerald-500' : 'bg-neutral-300'
                }`}
              />
              {i < events.length - 1 && (
                <span className="absolute top-3.5 left-1/2 h-full w-px -translate-x-1/2 bg-neutral-200" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-neutral-900">
                {e.title}
              </p>
              <p className="mt-0.5 text-[12px] text-neutral-500">{e.meta}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}