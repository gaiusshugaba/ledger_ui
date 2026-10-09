// components/VendorEditModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';

export type VendorModalMode =
  | { kind: 'add_vendor' }
  | { kind: 'add_alias'; vendorName: string; existingAliases: string[] }
  | { kind: 'edit_alias'; vendorName: string; existingAliases: string[]; alias: string };

export function VendorEditModal({
  mode,
  onSubmit,
  onClose,
}: {
  mode: VendorModalMode;
  onSubmit: (values: { name?: string; alias?: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(mode.kind === 'edit_alias' ? mode.alias : '');
  const [alias, setAlias] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (mode.kind === 'add_vendor') {
        if (!name.trim()) throw new Error('Vendor name is required');
        await onSubmit({ name: name.trim(), alias: alias.trim() || undefined });
      } else if (mode.kind === 'add_alias') {
        if (!alias.trim()) throw new Error('Alias is required');
        await onSubmit({ alias: alias.trim() });
      } else {
        if (!name.trim()) throw new Error('Alias is required');
        await onSubmit({ alias: name.trim() });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Save failed');
      setBusy(false);
    }
  }

  const title =
    mode.kind === 'add_vendor'
      ? 'Add vendor'
      : mode.kind === 'add_alias'
      ? `Add alias to ${mode.vendorName}`
      : `Rename alias`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          {mode.kind === 'add_vendor' && (
            <div>
              <label className="text-xs font-medium text-neutral-700">
                Vendor name
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ACME Inc."
                className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm focus:border-neutral-400 focus:outline-none"
              />
            </div>
          )}

          {mode.kind === 'add_vendor' && (
            <div>
              <label className="text-xs font-medium text-neutral-700">
                First alias <span className="text-neutral-400">(optional)</span>
              </label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="ACME Corporation"
                className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm focus:border-neutral-400 focus:outline-none"
              />
            </div>
          )}

          {mode.kind === 'add_alias' && (
            <div>
              <label className="text-xs font-medium text-neutral-700">
                Alias name
              </label>
              <input
                autoFocus
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="ACME Corp"
                className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm focus:border-neutral-400 focus:outline-none"
              />
              <p className="mt-2 text-[11px] text-neutral-500">
                Invoice vendor names matching this alias will resolve to the
                same vendor record.
              </p>
            </div>
          )}

          {mode.kind === 'edit_alias' && (
            <div>
              <label className="text-xs font-medium text-neutral-700">
                Rename alias
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm focus:border-neutral-400 focus:outline-none"
              />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}