// components/AuditLogTable.tsx
'use client';

import { useState } from 'react';
import { Cpu, ChevronDown, ChevronUp } from 'lucide-react';
import { AuditDiffPanel } from './AuditDiffPanel';

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  rawTimestamp: string | null;
  actor: string;
  actorType: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  before: any;
  after: any;
};

const GRID =
  'grid-cols-[150px_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1.5fr)_36px]';

export function AuditLogTable({ rows }: { rows: AuditLogEntry[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <p className="py-24 text-center text-sm text-neutral-400">
        No events match your filters.
      </p>
    );
  }

  return (
    <div>
      <div
        className={`grid ${GRID} items-center gap-4 border-b border-neutral-100 px-6 py-4 text-[11px] font-medium uppercase tracking-wider text-neutral-500`}
      >
        <span>Timestamp</span>
        <span>Actor</span>
        <span>Action</span>
        <span>Entity</span>
        <span>Reason / Details</span>
        <span />
      </div>

      {rows.map((row) => {
        const hasDiff = row.before != null || row.after != null;
        const expanded = expandedId === row.id;

        return (
          <div key={row.id} className="border-b border-neutral-100 last:border-b-0">
            <button
              type="button"
              disabled={!hasDiff}
              onClick={() => hasDiff && setExpandedId(expanded ? null : row.id)}
              className={`grid ${GRID} w-full items-center gap-4 px-6 py-4 text-left transition-colors ${
                hasDiff ? 'hover:bg-neutral-50' : 'cursor-default'
              } ${expanded ? 'bg-neutral-50/60' : ''}`}
            >
              <p className="text-sm text-neutral-700">{row.timestamp}</p>

              <ActorCell actor={row.actor} type={row.actorType} />

              <div>
                <ActionPill action={row.action} />
              </div>

              <div className="min-w-0">
                {row.entityType || row.entityId ? (
                  <>
                    <p className="truncate text-xs text-neutral-500">
                      {row.entityType}
                    </p>
                    <p className="truncate font-mono text-xs text-neutral-800">
                      {row.entityId}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-neutral-400">—</p>
                )}
              </div>

              <p className="truncate text-sm text-neutral-700">{row.details || '—'}</p>

              <span className="justify-self-end text-neutral-400">
                {hasDiff &&
                  (expanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  ))}
              </span>
            </button>

            {expanded && hasDiff && (
              <AuditDiffPanel
                actor={row.actor}
                action={row.action}
                timestamp={row.rawTimestamp}
                before={row.before}
                after={row.after}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActorCell({ actor, type }: { actor: string; type: string }) {
  const isSystem =
    type === 'system' || actor.toLowerCase().includes('system');

  if (isSystem) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100">
          <Cpu className="h-3.5 w-3.5 text-neutral-500" />
        </div>
        <span className="truncate text-sm text-neutral-700">system</span>
      </div>
    );
  }

  const initials = actor
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-600">
        {initials || '?'}
      </div>
      <span className="truncate text-sm text-neutral-700">{actor}</span>
    </div>
  );
}

function ActionPill({ action }: { action: string }) {
  const v = (action || '').toLowerCase();
  let cls = 'bg-neutral-100 text-neutral-600';

  if (v.includes('reconciled') || v.includes('success')) {
    cls = 'bg-[#DEF7EC] text-[#03543F]';
  } else if (v.includes('rejected') || v.includes('failed') || v.includes('error')) {
    cls = 'bg-[#FDE8E8] text-[#9B1C1C]';
  } else if (v.includes('override') || v.includes('changed')) {
    cls = 'bg-[#FEF3C7] text-[#92400E]';
  }

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium ${cls}`}
    >
      {action}
    </span>
  );
}