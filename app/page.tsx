// app/page.tsx
import { Suspense } from 'react';
import { DashboardContent } from './DashboardContent';

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-neutral-400">Loading dashboard…</div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}