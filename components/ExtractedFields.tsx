// components/ExtractedFields.tsx
'use client';

import { useEffect, useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

export type Field = {
  key: string;
  label: string;
  value: string;
  confidence: number | null;
  tone?: 'default' | 'danger';
  editable?: boolean;
};

export function ExtractedFields({
  fields,
  onChange,
}: {
  fields: Field[];
  onChange?: (key: string, newValue: string) => void;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.value])),
  );

  useEffect(() => {
    setValues((prev) => {
      const next = { ...prev };
      for (const f of fields) {
        if (!(f.key in next)) next[f.key] = f.value;
      }
      return next;
    });
  }, [fields]);

  function startEdit(f: Field) {
    if (f.editable === false) return;
    setEditingKey(f.key);
    setDraft(values[f.key] ?? f.value);
  }

  function commit() {
    if (editingKey == null) return;
    const newValue = draft.trim();
    setValues((prev) => ({ ...prev, [editingKey]: newValue }));
    onChange?.(editingKey, newValue);
    setEditingKey(null);
  }

  function cancel() {
    setEditingKey(null);
    setDraft('');
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {fields.map((f) => {
        const isEditing = editingKey === f.key;
        const displayValue = values[f.key] ?? f.value;

        return (
          <div
            key={f.key}
            className={`group rounded-xl bg-white px-3.5 py-3 ring-1 transition-colors ${
              isEditing
                ? 'ring-neutral-900'
                : 'ring-neutral-200 hover:ring-neutral-300'
            }`}
          >
            {/* Row 1: label left, pencil right */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium text-neutral-500">
                {f.label}
              </p>

              {f.editable !== false && !isEditing && (
                <button
                  type="button"
                  onClick={() => startEdit(f)}
                  className="rounded-md p-0.5 text-neutral-300 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-700 group-hover:opacity-100 focus:opacity-100"
                  aria-label={`Edit ${f.label}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Row 2: value left, confidence right — OR edit input */}
            <div className="mt-1.5">
              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commit();
                      if (e.key === 'Escape') cancel();
                    }}
                    onBlur={commit}
                    className="min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm font-semibold text-neutral-900 focus:border-neutral-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={commit}
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