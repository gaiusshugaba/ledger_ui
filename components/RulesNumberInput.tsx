// components/RulesNumberInput.tsx
'use client';

export function RulesNumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  helper,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  helper?: string;
  step?: string;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-neutral-900">{label}</p>

      <div className="flex items-stretch overflow-hidden rounded-xl border border-neutral-200 bg-white transition-colors focus-within:border-neutral-400">
        {prefix && (
          <span className="flex items-center border-r border-neutral-200 bg-neutral-50 px-3 text-xs font-medium text-neutral-500">
            {prefix}
          </span>
        )}

        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm font-medium text-neutral-900 focus:outline-none"
        />

        {suffix && (
          <span className="flex items-center px-3.5 text-xs font-medium text-neutral-500">
            {suffix}
          </span>
        )}
      </div>

      {helper && (
        <p className="mt-3 text-xs leading-relaxed text-neutral-500">
          {helper}
        </p>
      )}
    </div>
  );
}