// app/errors/page.tsx
import { Suspense } from 'react';
import { ErrorsContent } from './ErrorsContent';

export default function ErrorsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-neutral-400">Loading errors…</div>
      }
    >
      <ErrorsContent />
    </Suspense>
  );
}