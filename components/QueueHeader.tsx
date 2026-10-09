// components/QueueHeader.tsx
'use client';

import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';

type Tab = 'All' | 'Review' | 'Exceptions';
export type SortKey = 'severity' | 'age_desc' | 'age_asc' | 'amount_desc' | 'amount_asc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'severity', label: 'Sort: Severity' },
  { key: 'age_desc', label: 'Sort: Newest first' },
  { key: 'age_asc', label: 'Sort: Oldest first' },
  { key: 'amount_desc', label: 'Sort: Amount high → low' },
  { key: 'amount_asc', label: 'Sort: Amount low → high' },
];

export function QueueHeader({
  activeTab,
  onTabChange,
  counts,
  query,
  onQueryChange,
  sort,
  onSortChange,
}: {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  counts: Record<Tab, number>;
  query: string;
  onQueryChange: (v: string) => void;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const tabs: Tab[] = ['All', 'Review', 'Exceptions'];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest('[data-sort]')) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const currentLabel =
    SORT_OPTIONS.find((o) => o.key === sort)?.label ?? 'Sort: Severity';

  return (
    <div className="border-b border-neutral-200 px-8 pt-6 pb-4">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Review queue
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {counts.All} invoices need attention
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search queue by vendor, PO, invoice…"
              className="w-80 rounded-full border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/5"
            />
          </div>

          <div className="relative" data-sort>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {currentLabel}
              <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
            </button>
            {open && (
              <div className="absolute right-0 top-full z-40 mt-1 w-56 rounded-xl border border-neutral-200 bg-white p-1 shadow-lg">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => {
                      onSortChange(o.key);
                      setOpen(false);
                    }}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      sort === o.key
                        ? 'bg-neutral-100 font-medium text-neutral-900'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="inline-flex items-center gap-1 rounded-full bg-neutral-100 p-1">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTabChange(t)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                activeTab === t
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {t}
              <span className={activeTab === t ? 'ml-2 text-white/70' : 'ml-2 text-neutral-400'}>
                {counts[t]}
              </span>
            </button>
          ))}
        </div>

        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
          Sorted by severity · then age
        </p>
      </div>
    </div>
  );
}