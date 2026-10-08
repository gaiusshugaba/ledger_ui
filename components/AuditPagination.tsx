// components/AuditPagination.tsx
'use client';

export function AuditPagination({
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  noun = 'items',
}: {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  noun?: string;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = pageWindow(page, totalPages);

  return (
    <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-4">
      <p className="text-xs text-neutral-500">
        Showing {from}–{to} of {total.toLocaleString()} {noun}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-300"
        >
          Previous
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-neutral-400">
              ···
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p as number)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-neutral-900 text-white'
                  : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-300"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function pageWindow(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 3) return [1, 2, 3, '…', total];
  if (page >= total - 2) return [1, '…', total - 2, total - 1, total];
  return [1, '…', page, '…', total];
}