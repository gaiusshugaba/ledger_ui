// components/Sidebar.tsx
'use client';

import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Upload,
  ClipboardCheck,
  FileText,
  Wrench,
  SlidersHorizontal,
  Store,
  Bell,
  History,
  UsersRound,
  ChevronsUpDown,
} from 'lucide-react';
import { useCounts } from '@/lib/CountsContext';

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  count?: number;
  countTone?: 'neutral' | 'danger' | 'success';
};

export function Sidebar() {
  const pathname = usePathname();
  const { counts } = useCounts();

  const operations: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: LayoutGrid },
    { label: 'Upload', href: '/upload', icon: Upload },
    {
      label: 'Reconciled',
      href: '/reconciled',
      icon: ClipboardCheck,
      count: counts.reconciled,
      countTone: 'success',
    },
    {
      label: 'Review queue',
      href: '/queue',
      icon: FileText,
      count: counts.reviewQueue,
      countTone: 'danger',
    },
    {
      label: 'Errors',
      href: '/errors',
      icon: Wrench,
      count: counts.errors,
      countTone: 'danger',
    },
  ];

  const configuration: NavItem[] = [
    { label: 'Rules', href: '/rules', icon: SlidersHorizontal },
    { label: 'Vendors', href: '/vendors', icon: Store },
    { label: 'Notifications', href: '/notifications', icon: Bell },
  ];

  const administration: NavItem[] = [
    { label: 'Audit log', href: '/audit', icon: History },
    { label: 'Team', href: '/team', icon: UsersRound },
  ];

  function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
    return (
      <div className="mt-6">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          {label}
        </p>
        <ul className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            const toneClass =
              item.countTone === 'danger'
                ? 'text-red-500'
                : item.countTone === 'success'
                ? 'text-emerald-600'
                : 'text-neutral-400';

            return (
              <li key={item.label}>
                <a
                  href={item.href}
                  className={`flex items-center gap-3 rounded-full px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {typeof item.count === 'number' && item.count > 0 && (
                    <span
                      className={`text-xs font-medium ${
                        isActive ? 'text-white' : toneClass
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-neutral-200 bg-[#FAFAF8]">
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Ledger" className="h-10 w-10 object-contain" />
          <span className="text-lg font-semibold tracking-tight text-neutral-900">
            Ledger
          </span>
        </div>
        <button
          type="button"
          className="text-neutral-400 transition-colors hover:text-neutral-600"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
            <path d="m14 10-2 2 2 2" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        <NavGroup label="Operations" items={operations} />
        <NavGroup label="Configuration" items={configuration} />
        <NavGroup label="Administration" items={administration} />
      </nav>

      <div className="border-t border-neutral-200 p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-2.5 text-left shadow-sm ring-1 ring-neutral-200 transition-colors hover:bg-neutral-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
            GG
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-neutral-900">
              G. Gana, CPA
            </p>
            <p className="truncate text-[11px] text-neutral-500">Finance Lead</p>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
        </button>
      </div>
    </aside>
  );
}