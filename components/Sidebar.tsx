// components/Sidebar.tsx
'use client';

import { useEffect, useState } from 'react';
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
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useCounts } from '@/lib/CountsContext';

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  count?: number;
  countTone?: 'neutral' | 'danger' | 'success';
};

const STORAGE_KEY = 'ledger.sidebar.collapsed';

export function Sidebar() {
  const pathname = usePathname();
  const { counts } = useCounts();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'true') setCollapsed(true);
    } catch {
      /* ignore */
    }
    setMounted(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

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
      <div className="mt-6 first:mt-2">
        {!collapsed && (
          <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
            {label}
          </p>
        )}
        {collapsed && (
          <div className="mx-auto my-3 h-px w-6 bg-neutral-200" aria-hidden="true" />
        )}
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

            const showCount =
              typeof item.count === 'number' && item.count > 0;

            return (
              <li key={item.label}>
                <a
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`group relative flex items-center rounded-full transition-colors ${
                    collapsed
                      ? 'justify-center px-2 py-2.5'
                      : 'gap-3 px-3 py-2'
                  } ${
                    isActive
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />

                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {showCount && (
                        <span
                          className={`text-xs font-medium ${
                            isActive ? 'text-white' : toneClass
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </>
                  )}

                  {/* Small dot indicator when collapsed + has count */}
                  {collapsed && showCount && (
                    <span
                      className={`absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full ${
                        item.countTone === 'danger'
                          ? 'bg-red-500'
                          : item.countTone === 'success'
                          ? 'bg-emerald-500'
                          : 'bg-neutral-400'
                      }`}
                      aria-hidden="true"
                    />
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
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-neutral-200 bg-[#FAFAF8] transition-[width] duration-200 ease-out ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* Header: logo + collapse toggle */}
      <div
        className={`flex items-center py-5 ${
          collapsed ? 'flex-col gap-3 px-2' : 'justify-between px-4'
        }`}
      >
        <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Ledger"
            className="h-10 w-10 shrink-0 object-contain"
          />
          {!collapsed && (
            <span className="text-lg font-semibold tracking-tight text-neutral-900">
              Ledger
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav
        className={`flex-1 overflow-y-auto pb-4 ${
          collapsed ? 'px-2' : 'px-2'
        }`}
      >
        <NavGroup label="Operations" items={operations} />
        <NavGroup label="Configuration" items={configuration} />
        <NavGroup label="Administration" items={administration} />
      </nav>

      {/* User footer */}
      <div className={`border-t border-neutral-200 ${collapsed ? 'p-2' : 'p-3'}`}>
        {collapsed ? (
          <button
            type="button"
            title="G. Gana, CPA · Finance Lead"
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700 ring-1 ring-neutral-200 transition-colors hover:bg-purple-200"
          >
            GG
          </button>
        ) : (
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
              <p className="truncate text-[11px] text-neutral-500">
                Finance Lead
              </p>
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
          </button>
        )}
      </div>
    </aside>
  );
}