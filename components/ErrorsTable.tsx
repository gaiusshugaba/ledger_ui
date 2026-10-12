// components/ErrorsTable.tsx
'use client';

import Link from 'next/link';

export type ErrorRow = {
  id: string;
  timestamp: string;
  pipeline: string;
  step: string;
  errorType: string;
  errorMessage: string;
  severity: 'critical' | 'warning' | 'info';
  invoiceId: string | null;
};

const GRID =
  'grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,0.7fr)]';

const severityStyles: Record<
  ErrorRow['severity'],
  { dot: string; text: string }
> = {
  critical: { dot: 'bg-red-500', text: 'text-red-700' },
  warning: { dot: 'bg-amber-500', text: 'text-amber-700' },
  info: { dot: 'bg-neutral-400', text: 'text-neutral-600' },
};

export function ErrorsTable({ rows }: { rows: ErrorRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-24 text-center text-sm text-neutral-400">
        No unresolved errors.
      </p>
    );
  }

  return (
    <div>
      <div
        className={`grid ${GRID} items-center gap-4 border-b border-neutral-100 px-6 py-4 text-[11px] font-medium uppercase tracking-wider text-neutral-500`}
      >
        <span>Timestamp</span>
        <span>Pipeline</span>
        <span>Step</span>
        <span>Error Type</span>
        <span>Error Message</span>
        <span className="text-right">Actions</span>
      </div>

      {rows.map((row) => {
        const sev = severityStyles[row.severity];
        return (
          <div
            key={row.id}
            className={`grid ${GRID} items-center gap-4 border-b border-neutral-100 px-6 py-4 last:border-b-0`}
          >
            <p className="text-sm text-neutral-700">{row.timestamp}</p>

            <p className="truncate text-sm font-medium text-neutral-900">
              {row.pipeline}
            </p>

            <p className="truncate font-mono text-sm text-neutral-600">
              {row.step}
            </p>

            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${sev.dot}`} />
              <span className={`truncate text-sm font-medium ${sev.text}`}>
                {row.errorType}
              </span>
            </div>

            <p className="truncate text-sm text-neutral-600">
              {row.errorMessage}
            </p>

            <div className="flex justify-end">
              {row.invoiceId ? (
                <Link
                  href={`/queue/${row.invoiceId}`}
                  className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
                >
                  View invoice
                </Link>
              ) : (
                <span className="text-xs text-neutral-300">—</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}