// components/SeverityBand.tsx
'use client';

type Tone = 'low' | 'medium' | 'high';

const toneStyles: Record<Tone, string> = {
  low: 'bg-[#DEF7EC] text-[#03543F]',
  medium: 'bg-[#FEF3C7] text-[#92400E]',
  high: 'bg-[#FDE8E8] text-[#9B1C1C]',
};

export function SeverityBand({
  tone,
  label,
  title,
  description,
}: {
  tone: Tone;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="grid grid-cols-[100px_minmax(0,1fr)_minmax(0,1.1fr)] items-center gap-6 py-5 first:pt-0 last:pb-0">
      <span
        className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-medium ${toneStyles[tone]}`}
      >
        {label}
      </span>

      <p className="text-sm font-medium text-neutral-900">{title}</p>

      <p className="text-sm leading-relaxed text-neutral-500">
        {description}
      </p>
    </div>
  );
}