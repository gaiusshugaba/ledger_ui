// app/queue/page.tsx
import { Suspense } from 'react';
import { QueueContent } from './QueueContent';

export default function QueuePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-neutral-400">Loading queue…</div>
      }
    >
      <QueueContent />
    </Suspense>
  );
}