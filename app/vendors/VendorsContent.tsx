// app/vendors/VendorsContent.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { VendorsTable, type VendorRow } from '@/components/VendorsTable';
import { ReconciledPagination } from '@/components/ReconciledPagination';
import {
  VendorEditModal,
  type VendorModalMode,
} from '@/components/VendorEditModal';
import { createClient } from '@/lib/supabase/client';

const PAGE_SIZE = 9;

type RawExtraction = {
  id: string;
  invoice_id: string;
  vendor_name: string | null;
  vendor_confidence: number | null;
  invoice_number: string | null;
  invoice_date: string | null;
  amount: number | null;
  currency: string | null;
  extracted_at: string | null;
};

type RawInvoice = {
  id: string;
  status: string;
  created_at: string | null;
};

type RawVendor = {
  id: string;
  name: string;
  aliases: string[];
};

export function VendorsContent() {
  const [extractions, setExtractions] = useState<RawExtraction[]>([]);
  const [invoiceStatus, setInvoiceStatus] = useState<Record<string, string>>({});
  const [savedVendors, setSavedVendors] = useState<RawVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [modal, setModal] = useState<VendorModalMode | null>(null);

  // ── Load ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const [exRes, invRes, vendorRes] = await Promise.all([
        supabase
          .from('extractions')
          .select(
            'id, invoice_id, vendor_name, vendor_confidence, invoice_number, invoice_date, amount, currency, extracted_at',
          )
          .order('extracted_at', { ascending: false })
          .limit(1000),
        supabase.from('invoices').select('id, status, created_at').limit(1000),
        supabase.from('vendors').select('id, name, aliases'),
      ]);

      if (cancelled) return;

      if (exRes.error) {
        console.error('[vendors] extractions error:', exRes.error);
        setErrorMsg(exRes.error.message || 'Failed to load vendors');
        setLoading(false);
        return;
      }

      const statusMap: Record<string, string> = {};
      for (const inv of (invRes.data ?? []) as RawInvoice[]) {
        statusMap[inv.id] = inv.status;
      }

      setExtractions((exRes.data ?? []) as RawExtraction[]);
      setInvoiceStatus(statusMap);
      setSavedVendors((vendorRes.data ?? []) as RawVendor[]);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Vendor alias lookup by name (case-insensitive) ─────
  const aliasByName = useMemo(() => {
    const m = new Map<string, { id: string; aliases: string[] }>();
    for (const v of savedVendors) {
      m.set(v.name.toLowerCase(), { id: v.id, aliases: v.aliases });
    }
    return m;
  }, [savedVendors]);

  // ── Group extractions by vendor ────────────────────────
  const vendors: VendorRow[] = useMemo(() => {
    const map = new Map<string, VendorRow>();

    for (const ex of extractions) {
      const displayName = (ex.vendor_name || '').trim();
      if (!displayName) continue;

      const key = displayName.toLowerCase();
      const saved = aliasByName.get(key);
      const aliases = saved?.aliases ?? [];

      const existing = map.get(key);
      const conf =
        typeof ex.vendor_confidence === 'number' ? ex.vendor_confidence : null;

      const invoiceEntry = {
        id: ex.invoice_id ?? ex.id,
        invoiceNumber: ex.invoice_number ?? '—',
        date: ex.invoice_date ?? ex.extracted_at ?? null,
        amount: ex.amount ?? null,
        currency: ex.currency ?? 'USD',
        status: invoiceStatus[ex.invoice_id] ?? 'unknown',
        confidence: conf ?? 0,
      };

      if (existing) {
        existing.invoiceCount += 1;
        existing.confSum += conf ?? 0;
        existing.confCount += conf != null ? 1 : 0;
        existing.invoices.push(invoiceEntry);
        const latest = ex.extracted_at ?? '';
        if (latest > (existing.lastSeenIso ?? '')) {
          existing.lastSeenIso = latest;
        }
        // Keep aliases fresh
        existing.aliases = aliases;
      } else {
        map.set(key, {
          id: saved?.id ?? key,
          name: displayName,
          aliases,
          invoiceCount: 1,
          confSum: conf ?? 0,
          confCount: conf != null ? 1 : 0,
          avgConfidence: 0,
          lastSeenIso: ex.extracted_at ?? null,
          lastSeen: '',
          invoices: [invoiceEntry],
        });
      }
    }

    // Also include vendors saved in DB with no extractions yet
    for (const v of savedVendors) {
      const key = v.name.toLowerCase();
      if (map.has(key)) continue;
      map.set(key, {
        id: v.id,
        name: v.name,
        aliases: v.aliases,
        invoiceCount: 0,
        confSum: 0,
        confCount: 0,
        avgConfidence: 0,
        lastSeenIso: null,
        lastSeen: '—',
        invoices: [],
      });
    }

    const list = Array.from(map.values());
    for (const v of list) {
      v.avgConfidence = v.confCount > 0 ? v.confSum / v.confCount : 0;
      v.lastSeen = v.lastSeenIso ? timeAgo(v.lastSeenIso) : '—';
    }

    list.sort((a, b) => {
      if (b.invoiceCount !== a.invoiceCount)
        return b.invoiceCount - a.invoiceCount;
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [extractions, invoiceStatus, savedVendors, aliasByName]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.aliases.some((a) => a.toLowerCase().includes(q)),
    );
  }, [vendors, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const aliasReviewCount = vendors.filter((v) => v.aliases.length === 0).length;

  // ── Actions ────────────────────────────────────────────
  async function handleModalSubmit(values: { name?: string; alias?: string }) {
    if (!modal) return;
    const supabase = createClient();
    const now = new Date().toISOString();

    // ── ADD VENDOR ─────────────────────────────────────
    if (modal.kind === 'add_vendor') {
      const name = values.name?.trim();
      if (!name) throw new Error('Vendor name required');

      const aliases = values.alias?.trim() ? [values.alias.trim()] : [];

      const { data, error } = await supabase
        .from('vendors')
        .insert({ name, aliases })
        .select()
        .single();

      if (error) throw new Error(error.message);

      setSavedVendors((prev) => [
        ...prev,
        { id: data.id, name: data.name, aliases: data.aliases },
      ]);
      setToast(`Added vendor ${name}`);
      return;
    }

    // ── ADD ALIAS ──────────────────────────────────────
    if (modal.kind === 'add_alias') {
      const alias = values.alias?.trim();
      if (!alias) throw new Error('Alias required');

      const vendor = savedVendors.find(
        (v) => v.name.toLowerCase() === modal.vendorName.toLowerCase(),
      );

      if (!vendor) {
        // Create the vendor with this alias
        const { data, error } = await supabase
          .from('vendors')
          .insert({
            name: modal.vendorName,
            aliases: [alias],
          })
          .select()
          .single();

        if (error) throw new Error(error.message);
        setSavedVendors((prev) => [
          ...prev,
          { id: data.id, name: data.name, aliases: data.aliases },
        ]);
        setToast(`Added alias "${alias}"`);
        return;
      }

      if (vendor.aliases.includes(alias)) {
        throw new Error('Alias already exists');
      }

      const next = [...vendor.aliases, alias];
      const { error } = await supabase
        .from('vendors')
        .update({ aliases: next, updated_at: now })
        .eq('id', vendor.id);

      if (error) throw new Error(error.message);

      setSavedVendors((prev) =>
        prev.map((v) => (v.id === vendor.id ? { ...v, aliases: next } : v)),
      );
      setToast(`Added alias "${alias}"`);
      return;
    }

    // ── EDIT ALIAS ─────────────────────────────────────
    if (modal.kind === 'edit_alias') {
      const nextAlias = values.alias?.trim();
      if (!nextAlias) throw new Error('Alias required');
      if (nextAlias === modal.alias) return;

      const vendor = savedVendors.find(
        (v) => v.name.toLowerCase() === modal.vendorName.toLowerCase(),
      );
      if (!vendor) throw new Error('Vendor not found');

      const next = vendor.aliases.map((a) =>
        a === modal.alias ? nextAlias : a,
      );

      const { error } = await supabase
        .from('vendors')
        .update({ aliases: next, updated_at: now })
        .eq('id', vendor.id);

      if (error) throw new Error(error.message);

      setSavedVendors((prev) =>
        prev.map((v) => (v.id === vendor.id ? { ...v, aliases: next } : v)),
      );
      setToast(`Renamed to "${nextAlias}"`);
    }
  }

  async function handleRemoveAlias(vendorName: string, alias: string) {
    if (!confirm(`Remove alias "${alias}"?`)) return;

    const vendor = savedVendors.find(
      (v) => v.name.toLowerCase() === vendorName.toLowerCase(),
    );
    if (!vendor) return;

    const next = vendor.aliases.filter((a) => a !== alias);
    const supabase = createClient();

    const { error } = await supabase
      .from('vendors')
      .update({ aliases: next, updated_at: new Date().toISOString() })
      .eq('id', vendor.id);

    if (error) {
      console.error('[vendors] remove alias failed:', error);
      setToast(`Failed: ${error.message}`);
      return;
    }

    setSavedVendors((prev) =>
      prev.map((v) => (v.id === vendor.id ? { ...v, aliases: next } : v)),
    );
    setToast(`Removed "${alias}"`);
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="flex h-screen bg-[#FCFCFA] text-neutral-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-neutral-200 px-8 pt-6 pb-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Vendors
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                {vendors.length} vendors · {aliasReviewCount} pending alias review
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search vendors or aliases…"
                  className="w-80 rounded-full border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/5"
                />
              </div>

              <button
                type="button"
                onClick={() => setModal({ kind: 'add_vendor' })}
                className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
              >
                <Plus className="h-4 w-4" />
                Add vendors
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {loading ? (
              <p className="py-24 text-center text-sm text-neutral-400">Loading…</p>
            ) : errorMsg ? (
              <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <strong>Failed to load:</strong> {errorMsg}
              </div>
            ) : (
              <VendorsTable
                rows={pageRows}
                onAddAlias={(name, existing) =>
                  setModal({ kind: 'add_alias', vendorName: name, existingAliases: existing })
                }
                onEditAlias={(name, existing, alias) =>
                  setModal({
                    kind: 'edit_alias',
                    vendorName: name,
                    existingAliases: existing,
                    alias,
                  })
                }
                onRemoveAlias={handleRemoveAlias}
              />
            )}

            <ReconciledPagination
              total={filtered.length}
              page={currentPage}
              pageSize={PAGE_SIZE}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      </main>

      {modal && (
        <VendorEditModal
          mode={modal}
          onSubmit={handleModalSubmit}
          onClose={() => setModal(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return '';
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}