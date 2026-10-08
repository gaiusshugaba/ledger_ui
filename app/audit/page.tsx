// app/audit/page.tsx
import { Suspense } from 'react';
import { AuditContent } from './AuditContent';

export default function AuditPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-neutral-400">Loading audit log…</div>
      }
    >
      <AuditContent />
    </Suspense>
  );
}