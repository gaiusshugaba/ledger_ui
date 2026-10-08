// components/AuditDiffPanel.tsx
'use client';

import { Code2 } from 'lucide-react';

export function AuditDiffPanel({
  actor,
  action,
  timestamp,
  before,
  after,
}: {
  actor: string;
  action: string;
  timestamp: string | null;
  before: any;
  after: any;
}) {
  const beforeObj = toObject(before);
  const afterObj = toObject(after);

  return (
    <div className="border-t border-neutral-100 bg-neutral-50/40 px-6 py-5">
      <div className="rounded-2xl border-l-4 border-[#A8C93A] bg-white px-6 py-5 ring-1 ring-neutral-200">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="h-3.5 w-3.5 text-neutral-500" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
              Event Detail — {action.replace(/_/g, ' ')} by {actor}
            </p>
          </div>
          <p className="text-[11px] text-neutral-400">
            Timestamp: {timestamp ?? '—'}
          </p>
        </div>

        {/* Before / After */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Before
            </p>
            <CodeBlock value={beforeObj} other={afterObj} />
          </div>
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              After
            </p>
            <CodeBlock value={afterObj} other={beforeObj} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Changed via Rules &amp; Thresholds configuration.</span>
          <span className="font-mono text-neutral-400">
            Session ID: sess_{hash(actor + action)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({
  value,
  other,
}: {
  value: Record<string, any>;
  other: Record<string, any>;
}) {
  const keys = Object.keys(value);
  if (keys.length === 0) {
    return (
      <pre className="rounded-lg bg-[#1A1A1A] p-3.5 text-xs font-mono leading-relaxed text-neutral-500">
        {'{}'}
      </pre>
    );
  }

  return (
    <pre className="overflow-x-auto rounded-lg bg-[#1A1A1A] p-3.5 text-xs font-mono leading-relaxed text-white">
      <div className="text-neutral-500">{'{'}</div>
      {keys.map((k, i) => {
        const changed = JSON.stringify(value[k]) !== JSON.stringify(other[k]);
        const comma = i < keys.length - 1 ? ',' : '';
        return (
          <div key={k} className="pl-4">
            <span className="text-sky-300">&quot;{k}&quot;</span>
            <span className="text-neutral-400">: </span>
            {changed ? (
              <span className="rounded bg-[#264D2D] px-1 text-[#86EFAC]">
                {JSON.stringify(value[k])}
              </span>
            ) : (
              <span className="text-amber-200">{JSON.stringify(value[k])}</span>
            )}
            <span className="text-neutral-500">{comma}</span>
          </div>
        );
      })}
      <div className="text-neutral-500">{'}'}</div>
    </pre>
  );
}

function toObject(v: any): Record<string, any> {
  if (v == null) return {};
  if (typeof v === 'object' && !Array.isArray(v)) return v;
  return { value: v };
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36).slice(0, 7);
}