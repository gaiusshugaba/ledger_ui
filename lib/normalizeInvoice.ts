// lib/normalizeInvoice.ts
import type { QueueInvoice, Status } from '@/components/QueueRow';

export function normalizeInvoice(raw: Record<string, any>): QueueInvoice {
  const pick = (v: any) => (Array.isArray(v) ? v[0] : v);

  const ex = pick(raw.extraction ?? raw.extractions) ?? {};
  const match = pick(raw.match ?? raw.matches) ?? {};

  return {
    id: String(raw.id),
    status: normalizeStatus(raw.status),
    company: ex.vendor_name || '—',
    amount: formatMoney(ex.amount, ex.currency),
    invoiceNumber: ex.invoice_number || '—',
    itemCount: Array.isArray(ex.line_items) ? ex.line_items.length : 0,
    age: timeAgo(raw.created_at ?? raw.uploaded_at),
    source: capitalize(raw.source ?? 'email') as 'Email' | 'Upload',
    reason: match.tier_reason || undefined,
  };
}

function normalizeStatus(s: string | null | undefined): Status {
  const v = (s ?? '').toLowerCase();
  if (v.startsWith('exc')) return 'Exception';
  if (v === 'review_required' || v.startsWith('rev')) return 'Review';
  if (v.startsWith('app')) return 'Approved';
  if (v.startsWith('paid') || v.startsWith('recon')) return 'Paid';
  return 'Review';
}

function formatMoney(
  v: number | string | null | undefined,
  currency?: string,
): string {
  if (v == null) return '—';
  const n = typeof v === 'string' ? Number(v.replace(/[^0-9.-]/g, '')) : v;
  if (!Number.isFinite(n)) return '—';
  const symbol = currency === 'USD' || !currency ? '$' : `${currency} `;
  return `${symbol}${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return '';
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}