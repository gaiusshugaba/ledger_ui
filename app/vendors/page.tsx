// app/vendors/page.tsx
import { Suspense } from 'react';
import { VendorsContent } from './VendorsContent';

export default function VendorsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-neutral-400">Loading vendors…</div>
      }
    >
      <VendorsContent />
    </Suspense>
  );
}