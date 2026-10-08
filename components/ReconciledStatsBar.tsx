// components/ReconciledStatsBar.tsx
'use client';

export function ReconciledStatsBar({
  todayCount,
  weekCount,
  matchRate,
}: {
  todayCount: number;
  weekCount: number;
  matchRate: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-6 py-4">
      <div className="flex items-center gap-8 text-sm">
        <p className="text-neutral-600">
          Today:{' '}
          <span className="ml-1 font-semibold text-neutral-900">{todayCount}</span>{' '}
          <span className="text-neutral-500">auto-reconciled</span>
        </p>
        <p className="text-neutral-600">
          This week:{' '}
          <span className="ml-1 font-semibold text-neutral-900">{weekCount}</span>
        </p>
      </div>

      <span className="inline-flex items-center rounded-full bg-[#DEF7EC] px-3 py-1 text-xs font-medium text-[#03543F]">
        {matchRate}% Match Rate
      </span>
    </div>
  );
}