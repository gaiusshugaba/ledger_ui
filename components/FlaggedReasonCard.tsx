// components/FlaggedReasonCard.tsx
'use client';

export function FlaggedReasonCard({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) return null;

  return (
    <div className="rounded-xl bg-[#FEF9E7] px-4 py-3 ring-1 ring-[#FDE68A]/60">
      <ul className="space-y-1.5">
        {reasons.map((r, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[#78350F]">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D97706]" />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}