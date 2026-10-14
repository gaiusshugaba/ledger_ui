// components/MobileGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { Monitor, Copy, Check } from 'lucide-react';

/**
 * Renders its children on desktop (>= 1024px) and a "best viewed on desktop"
 * message on tablet and mobile. Uses CSS media queries — no flash, no
 * hydration mismatch.
 */
export function MobileGuard({ children }: { children: React.ReactNode }) {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Read the current URL after mount to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(window.location.href);
    }
  }, []);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      {/* Desktop: render the actual app */}
      <div className="hidden lg:block">{children}</div>

      {/* Mobile / tablet: render the message */}
      <div className="flex min-h-screen items-center justify-center bg-[#FCFCFA] px-6 py-12 lg:hidden">
        <div className="w-full max-w-md text-center">
          {/* Logo */}
          <div className="mb-10 flex items-center justify-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="Ledger"
              className="h-12 w-12 object-contain"
            />
            <span className="text-xl font-semibold tracking-tight text-neutral-900">
              Ledger
            </span>
          </div>

          {/* Icon tile */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
            <Monitor className="h-7 w-7 text-neutral-500" strokeWidth={1.8} />
          </div>

          {/* Headline */}
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
            Best viewed on desktop
          </h1>

          {/* Explanation */}
          <p className="mt-3 text-sm leading-relaxed text-neutral-500">
            Ledger is a reconciliation workspace built for larger screens.
            Side-by-side document viewing, per-field confidence, and the review
            queue need room to breathe.
          </p>

          {/* Link card */}
          <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-4 text-left">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
              Open this page on desktop
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate font-mono text-xs text-neutral-700">
                {url || '—'}
              </p>
              <button
                type="button"
                onClick={copyUrl}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="mt-6 text-xs text-neutral-400">
            Any screen wider than 1024px will load the full experience.
          </p>
        </div>
      </div>
    </>
  );
}