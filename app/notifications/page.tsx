// app/notifications/page.tsx
import { Suspense } from 'react';
import { NotificationsContent } from './NotificationsContent';

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-neutral-400">Loading notifications…</div>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}