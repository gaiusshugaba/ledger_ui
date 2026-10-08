// lib/CountsContext.tsx
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { createClient } from '@/lib/supabase/client';

type Counts = {
  reconciled: number;
  reviewQueue: number;
  errors: number;
};

type Ctx = {
  counts: Counts;
  refresh: () => Promise<void>;
  loading: boolean;
};

const CountsContext = createContext<Ctx | undefined>(undefined);

export function CountsProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<Counts>({
    reconciled: 0,
    reviewQueue: 0,
    errors: 0,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const supabase = createClient();

    const [reconciled, queue, errors] = await Promise.all([
      supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'reconciled'),
      supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .in('status', ['review_required', 'exception']),
      supabase
        .from('errors')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', false),
    ]);

    setCounts({
      reconciled: reconciled.count ?? 0,
      reviewQueue: queue.count ?? 0,
      errors: errors.count ?? 0,
    });
    setLoading(false);
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <CountsContext.Provider value={{ counts, refresh, loading }}>
      {children}
    </CountsContext.Provider>
  );
}

export function useCounts() {
  const ctx = useContext(CountsContext);
  if (!ctx) {
    throw new Error('useCounts must be used inside <CountsProvider>');
  }
  return ctx;
}