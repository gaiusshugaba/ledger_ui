// components/TeamMembersTable.tsx
'use client';

import { Pencil, X, Mail } from 'lucide-react';

export type MemberRole = 'Admin' | 'Approver' | 'Viewer';

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  status: 'active' | 'pending';
  lastActive: string;
  lastActiveLive?: boolean;
  invoicesThisWeek: number | null;
};

const GRID =
  'grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_72px]';

const roleStyles: Record<MemberRole, string> = {
  Admin: 'bg-[#EDE9FE] text-[#5B21B6]',
  Approver: 'bg-transparent text-neutral-800',
  Viewer: 'bg-neutral-100 text-neutral-600',
};

const avatarPalette = [
  'bg-[#DDD6FE] text-[#5B21B6]', // purple
  'bg-[#D1FAE5] text-[#065F46]', // green
  'bg-[#FEF3C7] text-[#92400E]', // amber
  'bg-[#FCE7F3] text-[#9F1239]', // pink
  'bg-[#DBEAFE] text-[#1E40AF]', // blue
];

export function TeamMembersTable({
  rows,
  onEdit,
  onRemove,
  onResend,
}: {
  rows: TeamMember[];
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  onResend?: (id: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-neutral-400">
        No team members match your filter.
      </p>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        className={`grid ${GRID} items-center gap-4 border-b border-neutral-100 px-6 py-4 text-[11px] font-medium uppercase tracking-wider text-neutral-500`}
      >
        <span>Member</span>
        <span>Role</span>
        <span>Last Active</span>
        <span className="text-right">Invoices This Week</span>
        <span className="text-right">Actions</span>
      </div>

      {rows.map((m, idx) => {
        const pending = m.status === 'pending';
        return (
          <div
            key={m.id}
            className={`grid ${GRID} items-center gap-4 border-b border-neutral-100 px-6 py-4 last:border-b-0 ${
              pending ? 'bg-neutral-50/40' : ''
            }`}
          >
            {/* Member cell */}
            <div className="flex min-w-0 items-center gap-3">
              {pending ? (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-neutral-300 bg-white">
                  <Mail className="h-4 w-4 text-neutral-400" />
                </div>
              ) : (
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    avatarPalette[idx % avatarPalette.length]
                  }`}
                >
                  {initials(m.name)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={`truncate text-sm font-medium ${
                      pending ? 'text-neutral-500' : 'text-neutral-900'
                    }`}
                  >
                    {m.name}
                  </p>
                  {pending && (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-[#FDE8E8] px-2 py-0.5 text-[10px] font-medium text-[#9B1C1C]">
                      Pending
                    </span>
                  )}
                </div>
                <p
                  className={`truncate text-xs ${
                    pending ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  {m.email}
                </p>
              </div>
            </div>

            {/* Role */}
            <div>
              <span
                className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-medium ${roleStyles[m.role]}`}
              >
                {m.role}
              </span>
            </div>

            {/* Last active */}
            <div className="flex items-center gap-2">
              {m.lastActiveLive && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
              <span className="text-sm text-neutral-600">{m.lastActive}</span>
            </div>

            {/* Invoices */}
            <p className="text-right text-sm text-neutral-900">
              {m.invoicesThisWeek == null ? '—' : m.invoicesThisWeek}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-1.5">
              {pending ? (
                <>
                  <button
                    type="button"
                    onClick={() => onResend?.(m.id)}
                    className="text-xs font-medium text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline"
                  >
                    Resend invite
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove?.(m.id)}
                    aria-label="Cancel invite"
                    className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onEdit?.(m.id)}
                    aria-label="Edit member"
                    className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove?.(m.id)}
                    aria-label="Remove member"
                    className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}