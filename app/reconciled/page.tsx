// app/reconciled/page.tsx
import { Suspense } from 'react';
import { ReconciledContent } from './ReconciledContent';

export default function ReconciledPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-neutral-400">Loading reconciled…</div>
      }
    >
      <ReconciledContent />
    </Suspense>
  );
}