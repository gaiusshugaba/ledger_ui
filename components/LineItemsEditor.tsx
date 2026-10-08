// components/LineItemsEditor.tsx
'use client';

import { useState } from 'react';
import { AlertTriangle, X, Plus, Pencil, Check, Loader2 } from 'lucide-react';

export type LineItemRow = {
  description: string;
  qty: number;
  unit_price: number;
  total: number;
  status?: 'warning' | 'error' | null;
};

type Draft = {
  description: string;
  qty: string;
  unit_price: string;
  total: string;
};

const ROW_GRID =
  'grid-cols-[minmax(0,1.7fr)_56px_96px_100px_72px]';

export function LineItemsEditor({
  items,
  onSave,
}: {
  items: LineItemRow[];
  onSave: (next: LineItemRow[]) => Promise<void> | void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isNewRow, setIsNewRow] = useState(false);
  const [saving, setSaving] = useState(false);

  function startEdit(i: number) {
    if (saving) return;
    setEditingIndex(i);
    setDraft({
      description: items[i].description,
      qty: String(items[i].qty),
      unit_price: String(items[i].unit_price),
      total: String(items[i].total),
    });
    setIsNewRow(false);
  }

  function startAdd() {
    if (saving) return;
    setEditingIndex(items.length);
    setDraft({ description: '', qty: '1', unit_price: '0', total: '0' });
    setIsNewRow(true);
  }

  function updateDraft(field: keyof Draft, value: string) {
    if (!draft) return;
    const next = { ...draft, [field]: value };
    // Auto-recalc total when qty or unit_price changes
    if (field === 'qty' || field === 'unit_price') {
      const q = Number(next.qty) || 0;
      const u = Number(next.unit_price.replace(/[^0-9.-]/g, '')) || 0;
      next.total = (q * u).toFixed(2);
    }
    setDraft(next);
  }

  async function commit() {
    if (editingIndex === null || !draft || saving) return;

    const parsed: LineItemRow = {
      description: draft.description.trim() || 'Untitled',
      qty: Number(draft.qty) || 0,
      unit_price: Number(draft.unit_price.replace(/[^0-9.-]/g, '')) || 0,
      total: Number(draft.total.replace(/[^0-9.-]/g, '')) || 0,
      status: null,
    };

    const next = [...items];
    if (isNewRow) {
      next.push(parsed);
    } else {
      next[editingIndex] = { ...parsed, status: items[editingIndex].status };
    }

    setSaving(true);
    setEditingIndex(null);
    setDraft(null);
    setIsNewRow(false);

    try {
      await onSave(next);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setEditingIndex(null);
    setDraft(null);
    setIsNewRow(false);
  }

  async function remove(index: number) {
    if (saving) return;
    const next = items.filter((_, i) => i !== index);
    setSaving(true);
    try {
      await onSave(next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-neutral-900">
            Line items
          </span>
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
          {saving && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving…
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={startAdd}
          disabled={saving || editingIndex !== null}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add line
        </button>
      </div>

      {/* Table */}
      <div>
        <div
          className={`grid ${ROW_GRID} items-center gap-2 border-y border-neutral-100 bg-neutral-50/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500`}
        >
          <span>Description</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Unit Price</span>
          <span className="text-right">Total</span>
          <span />
        </div>

        {items.length === 0 && !isNewRow && (
          <p className="py-10 text-center text-xs text-neutral-400">
            No line items extracted.
          </p>
        )}

        {items.map((it, i) => {
          const isEditing = editingIndex === i;
          const rowBg =
            it.status === 'error'
              ? 'bg-[#FBE4E4]'
              : it.status === 'warning'
              ? 'bg-[#FEF9E7]'
              : '';

          if (isEditing && draft) {
            return (
              <div
                key={i}
                className={`grid ${ROW_GRID} items-center gap-2 border-b border-neutral-100 bg-neutral-50/60 px-4 py-2.5 last:border-b-0`}
              >
                <input
                  autoFocus
                  value={draft.description}
                  onChange={(e) => updateDraft('description', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commit();
                    if (e.key === 'Escape') cancel();
                  }}
                  placeholder="Description"
                  className="min-w-0 rounded-md border border-neutral-300 bg-white px-2 py-1 text-[13px] font-medium text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
                <input
                  value={draft.qty}
                  onChange={(e) => updateDraft('qty', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commit();
                    if (e.key === 'Escape') cancel();
                  }}
                  inputMode="decimal"
                  placeholder="0"
                  className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-right text-[13px] text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
                <input
                  value={draft.unit_price}
                  onChange={(e) => updateDraft('unit_price', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commit();
                    if (e.key === 'Escape') cancel();
                  }}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-right text-[13px] text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
                <input
                  value={draft.total}
                  onChange={(e) => updateDraft('total', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commit();
                    if (e.key === 'Escape') cancel();
                  }}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-right text-[13px] text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
                <div className="flex items-center justify-end gap-0.5">
                  <button
                    type="button"
                    onClick={commit}
                    disabled={saving}
                    className="rounded-md p-1 text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50"
                    aria-label="Save line"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={cancel}
                    disabled={saving}
                    className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 disabled:opacity-50"
                    aria-label="Cancel"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={i}
              className={`group grid ${ROW_GRID} items-center gap-2 border-b border-neutral-100 px-4 py-3 last:border-b-0 ${rowBg}`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-[13px] font-medium text-neutral-900">
                  {it.description}
                </span>
                {it.status === 'warning' && (
                  <AlertTriangle
                    className="h-3.5 w-3.5 shrink-0 text-amber-600"
                    strokeWidth={2.4}
                  />
                )}
                {it.status === 'error' && (
                  <X
                    className="h-3.5 w-3.5 shrink-0 text-red-600"
                    strokeWidth={2.6}
                  />
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
              <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => startEdit(i)}
                  disabled={saving || editingIndex !== null}
                  className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
                  aria-label="Edit line"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  disabled={saving || editingIndex !== null}
                  className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-red-600 disabled:opacity-50"
                  aria-label="Remove line"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* New-row editor (when Add line was clicked) */}
        {isNewRow && draft && (
          <div
            className={`grid ${ROW_GRID} items-center gap-2 border-b border-neutral-100 bg-neutral-50/60 px-4 py-2.5 last:border-b-0`}
          >
            <input
              autoFocus
              value={draft.description}
              onChange={(e) => updateDraft('description', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') cancel();
              }}
              placeholder="Description"
              className="min-w-0 rounded-md border border-neutral-300 bg-white px-2 py-1 text-[13px] font-medium text-neutral-900 focus:border-neutral-900 focus:outline-none"
            />
            <input
              value={draft.qty}
              onChange={(e) => updateDraft('qty', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') cancel();
              }}
              inputMode="decimal"
              placeholder="0"
              className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-right text-[13px] text-neutral-900 focus:border-neutral-900 focus:outline-none"
            />
            <input
              value={draft.unit_price}
              onChange={(e) => updateDraft('unit_price', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') cancel();
              }}
              inputMode="decimal"
              placeholder="0.00"
              className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-right text-[13px] text-neutral-900 focus:border-neutral-900 focus:outline-none"
            />
            <input
              value={draft.total}
              onChange={(e) => updateDraft('total', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') cancel();
              }}
              inputMode="decimal"
              placeholder="0.00"
              className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-right text-[13px] text-neutral-900 focus:border-neutral-900 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-0.5">
              <button
                type="button"
                onClick={commit}
                disabled={saving}
                className="rounded-md p-1 text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50"
                aria-label="Save line"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={cancel}
                disabled={saving}
                className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 disabled:opacity-50"
                aria-label="Cancel"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </div>
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