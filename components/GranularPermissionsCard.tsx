// components/GranularPermissionsCard.tsx
'use client';

import { Shield } from 'lucide-react';

export function GranularPermissionsCard({
  onConfigure,
}: {
  onConfigure?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-2xl border border-neutral-200 bg-white px-6 py-5">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DEF7EC]">
          <Shield className="h-4 w-4 text-[#03543F]" strokeWidth={2} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900">
            Need granular team permissions?
          </p>
          <p className="mt-1 text-sm leading-relaxed text-neutral-500">
            Admins have complete control over OCR rules and vendor matching
            thresholds, while Approvers are restricted to exception reviews.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onConfigure}
        className="shrink-0 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
      >
        Configure Roles
      </button>
    </div>
  );
}