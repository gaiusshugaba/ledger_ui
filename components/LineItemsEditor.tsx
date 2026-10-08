// components/LineItemsEditor.tsx
'use client';

import { AlertTriangle, X, Plus, Pencil } from 'lucide-react';

export type LineItemRow = {
  description: string;
  qty: number;
  unit_price: number;
  total: number;
  status?: 'warning' | 'error' | null;
};

export function LineItemsEditor({
  items,
  pendingEdits,
  onAdd,
  onEdit,
}: {
  items: LineItemRow[];
  pendingEdits?: number;
  onAdd?: () => void;
  onEdit?: (index: number) => void;
}) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-neutral-900">Line items</span>
          {pendingEdits != null && pendingEdits > 0 && (
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
              {pendingEdits} edits pending
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add line
        </button>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <p className="py-10 text-center text-xs text-neutral-400">
          No line items extracted.
        </p>
      ) : (
        <div>
          <div className="grid grid-cols-[minmax(0,1.7fr)_56px_96px_100px_40px] items-center gap-2 border-y border-neutral-100 bg-neutral-50/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            <span>Description</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Unit Price</span>
            <span className="text-right">Total</span>
            <span />
          </div>

          {items.map((it, i) => {
            const rowBg =
              it.status === 'error'
                ? 'bg-[#FBE4E4]'
                : it.status === 'warning'
                ? 'bg-[#FEF9E7]'
                : '';
            return (
              <div
                key={i}
                className={`grid grid-cols-[minmax(0,1.7fr)_56px_96px_100px_40px] items-center gap-2 border-b border-neutral-100 px-4 py-3 last:border-b-0 ${rowBg}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate text-[13px] font-medium text-neutral-900">
                    {it.description}
                  </span>
                  {it.status === 'warning' && (
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" strokeWidth={2.4} />
                  )}
                  {it.status === 'error' && (
                    <X className="h-3.5 w-3.5 shrink-0 text-red-600" strokeWidth={2.6} />
                  )}
                </div>
                <span className="text-right text-[13px] text-neutral-700">
                  {it.qty}
                </span>
                <span className="text-right text-[13px] text-neutral-700">
                  {fmtMoney(it.unit_price)}
                </span>
                <span className="text-right text-[13px] text-neutral-900">
                  {fmtMoney(it.total)}
                </span>
                <button
                  type="button"
                  onClick={() => onEdit?.(i)}
                  className="justify-self-end rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                  aria-label="Edit line"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function fmtMoney(v: number): string {
  if (!Number.isFinite(v)) return '—';
  return `$${v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}