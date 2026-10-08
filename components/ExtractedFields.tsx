// components/ExtractedFields.tsx
'use client';

import { useEffect, useState } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';

export type Field = {
  key: string;
  label: string;
  value: string;       // formatted display value, e.g. "$87,750.00"
  rawValue: string;    // raw editable value, e.g. "87750.00"
  confidence: number | null;
  tone?: 'default' | 'danger';
  editable?: boolean;
  numeric?: boolean;   // if true, input uses inputMode="decimal"
};

export function ExtractedFields({
  fields,
  onChange,
  savingKeys,
}: {
  fields: Field[];
  onChange?: (key: string, newRawValue: string) => void | Promise<void>;
  savingKeys?: Set<string>;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  // Keep local display values in sync when parent updates the fields array
  useEffect(() => {
    setLocalValues((prev) => {
      const next = { ...prev };
      for (const f of fields) {
        if (!(f.key in next)) next[f.key] = f.value;
      }
      return next;
    });
  }, [fields]);

  function startEdit(f: Field) {
    if (f.editable === false || savingKeys?.has(f.key)) return;
    setEditingKey(f.key);
    setDraft(f.rawValue);
  }

  async function commit(f: Field) {
    if (editingKey !== f.key) return;
    const newRaw = draft.trim();
    setEditingKey(null);

    // No change? Bail.
    if (newRaw === f.rawValue) return;

    // Optimistic: update display immediately
    setLocalValues((prev) => ({ ...prev, [f.key]: formatForDisplay(newRaw, f) }));

    try {
      await onChange?.(f.key, newRaw);
    } catch (err) {
      // Roll back on failure
      setLocalValues((prev) => ({ ...prev, [f.key]: f.value }));
      console.error('[fields] save failed:', err);
    }
  }

  function cancel() {
    setEditingKey(null);
    setDraft('');
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {fields.map((f) => {
        const isEditing = editingKey === f.key;
        const isSaving = savingKeys?.has(f.key) ?? false;
        const displayValue = localValues[f.key] ?? f.value;

        return (
          <div
            key={f.key}
            className={`group rounded-xl bg-white px-3.5 py-3 ring-1 transition-colors ${
              isEditing
                ? 'ring-neutral-900'
                : 'ring-neutral-200 hover:ring-neutral-300'
            }`}
          >
            {/* Row 1: label + edit pencil */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium text-neutral-500">
                {f.label}
              </p>

              {f.editable !== false && !isEditing && (
                <button
                  type="button"
                  onClick={() => startEdit(f)}
                  disabled={isSaving}
                  className="rounded-md p-0.5 text-neutral-300 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-700 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                  aria-label={`Edit ${f.label}`}
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Pencil className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>

            {/* Row 2: value OR edit input */}
            <div className="mt-1.5">
              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={draft}
                    inputMode={f.numeric ? 'decimal' : 'text'}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commit(f);
                      if (e.key === 'Escape') cancel();
                    }}
                    onBlur={() => commit(f)}
                    className="min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm font-semibold text-neutral-900 focus:border-neutral-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => commit(f)}
                    className="rounded-md p-1 text-emerald-600 transition-colors hover:bg-emerald-50"
                    aria-label="Save"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={cancel}
                    className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100"
                    aria-label="Cancel"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={`min-w-0 truncate text-sm font-semibold ${
                      f.tone === 'danger' ? 'text-red-600' : 'text-neutral-900'
                    }`}
                  >
                    {displayValue}
                  </p>

                  {f.confidence != null && (
                    <span
                      className={`shrink-0 text-[11px] ${
                        f.confidence >= 0.9
                          ? 'text-neutral-500'
                          : f.confidence >= 0.7
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    >
                      {f.confidence.toFixed(2)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Reformats a raw editable value back into a display string.
 * Strips currency symbols/commas for numeric fields.
 */
function formatForDisplay(raw: string, f: Field): string {
  if (!f.numeric) return raw;

  const n = Number(raw.replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(n)) return raw;

  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}