// app/team/TeamContent.tsx
'use client';

import { useMemo, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { TeamStatsRow } from '@/components/TeamStatsRow';
import { TeamMembersTable, type TeamMember } from '@/components/TeamMembersTable';
import { GranularPermissionsCard } from '@/components/GranularPermissionsCard';

const MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'G. Gana',
    email: 'GGana@company.com',
    role: 'Admin',
    status: 'active',
    lastActive: 'Active now',
    lastActiveLive: true,
    invoicesThisWeek: 42,
  },
  {
    id: '2',
    name: 'M. Smith',
    email: 'msmith@company.com',
    role: 'Approver',
    status: 'active',
    lastActive: '2h ago',
    invoicesThisWeek: 18,
  },
  {
    id: '3',
    name: 'R. Kim',
    email: 'rkim@company.com',
    role: 'Approver',
    status: 'active',
    lastActive: 'Yesterday',
    invoicesThisWeek: 12,
  },
  {
    id: '4',
    name: 'A. Lopez',
    email: 'alopez@company.com',
    role: 'Viewer',
    status: 'active',
    lastActive: '3d ago',
    invoicesThisWeek: 0,
  },
  {
    id: '5',
    name: 'Pending invite',
    email: 'bchen@company.com',
    role: 'Approver',
    status: 'pending',
    lastActive: '—',
    invoicesThisWeek: null,
  },
];

export function TeamContent() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MEMBERS;
    return MEMBERS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q),
    );
  }, [query]);

  const activeSeats = MEMBERS.filter((m) => m.status === 'active').length;
  const pendingInvites = MEMBERS.filter((m) => m.status === 'pending').length;
  const totalApproved = MEMBERS.reduce(
    (s, m) => s + (m.invoicesThisWeek ?? 0),
    0,
  );

  return (
    <div className="flex h-screen bg-[#FCFCFA] text-neutral-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-neutral-200 px-8 pt-6 pb-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Team
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                {MEMBERS.length} members · {pendingInvites} pending invite
                {pendingInvites === 1 ? '' : 's'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter members…"
                  className="w-72 rounded-full border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/5"
                />
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
              >
                <Plus className="h-4 w-4" />
                Invite member
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-8 py-6">
          {/* Stats row */}
          <TeamStatsRow
            activeSeats={activeSeats}
            totalSeats={10}
            approvedThisWeek={totalApproved}
            securityMode="3-Way Dual Sign-off"
          />

          {/* Members table */}
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <TeamMembersTable
              rows={filtered}
              onEdit={(id) => console.log('edit', id)}
              onRemove={(id) => console.log('remove', id)}
              onResend={(id) => console.log('resend', id)}
            />

            <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-4">
              <p className="text-xs text-neutral-500">
                Showing {filtered.length} member
                {filtered.length === 1 ? '' : 's'}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled
                  className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-medium text-neutral-300 transition-colors disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-white"
                >
                  1
                </button>
                <button
                  type="button"
                  disabled
                  className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-medium text-neutral-300 transition-colors disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Granular permissions card */}
          <GranularPermissionsCard />
        </div>
      </main>
    </div>
  );
}