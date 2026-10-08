// app/team/page.tsx
import { Suspense } from 'react';
import { TeamContent } from './TeamContent';

export default function TeamPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-neutral-400">Loading team…</div>
      }
    >
      <TeamContent />
    </Suspense>
  );
}