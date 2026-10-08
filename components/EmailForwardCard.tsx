// components/EmailForwardCard.tsx
'use client';

import { useState } from 'react';
import { Mail, Copy, Check, ShieldCheck } from 'lucide-react';

export function EmailForwardCard({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex flex-col justify-center rounded-2xl bg-[#E6E0FB] p-7">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Mail className="h-5 w-5 text-[#4C1D95]" strokeWidth={2.2} />
        <h2 className="text-[17px] font-semibold tracking-tight text-[#4C1D95]">
          Email Forwarding Channel
        </h2>
      </div>

      {/* Description */}
      <p className="mt-3 text-[13px] leading-[1.55] text-[#6B6A8E]">
        Attachments are processed automatically. Emails from known vendors are
        prioritized.
      </p>

      {/* Email panel */}
      <div className="mt-5 rounded-2xl border border-[#EDE9FE] bg-white p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6D28D9]">
          Forward invoices to:
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="truncate font-mono text-sm font-medium text-[#4C1D95]">
            {email}
          </p>
          <button
            type="button"
            onClick={copy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#EDE9FE] bg-white px-3.5 py-1.5 text-xs font-medium text-[#4C1D95] transition-colors hover:bg-[#F5F3FF]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" strokeWidth={2.2} />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* SPF pill */}
      <div className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#EDE9FE] bg-[#F5F1FE] px-3 py-1.5 text-[11px] font-medium text-[#6B6A8E]">
        <ShieldCheck className="h-3.5 w-3.5 text-[#6B6A8E]" strokeWidth={2.2} />
        SPF/DKIM Enforced
      </div>
    </div>
  );
}