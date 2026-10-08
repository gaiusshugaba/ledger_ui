// app/upload/page.tsx
import { Suspense } from 'react';
import { UploadContent } from './UploadContent';

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-neutral-400">Loading uploads…</div>
      }
    >
      <UploadContent />
    </Suspense>
  );
}