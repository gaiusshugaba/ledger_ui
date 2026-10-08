// app/queue/[id]/page.tsx
import { Suspense } from 'react';
import { ReviewContent } from './ReviewContent';

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-neutral-400">Loading review…</div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}