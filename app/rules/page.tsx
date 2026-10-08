// app/rules/page.tsx
import { Suspense } from 'react';
import { RulesContent } from './RulesContent';

export default function RulesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-neutral-400">Loading rules…</div>
      }
    >
      <RulesContent />
    </Suspense>
  );
}