// components/RulesSlider.tsx
'use client';

export function RulesSlider({
  label,
  value,
  onChange,
  helper,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  helper?: string;
}) {
  const pct = Math.round(value * 100);
  const trackBg = `linear-gradient(to right, #A8C93A 0%, #A8C93A ${pct}%, #E5E5E5 ${pct}%, #E5E5E5 100%)`;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <label className="text-sm font-semibold text-neutral-900">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold text-neutral-900 tabular-nums">
            {value.toFixed(2)}
          </span>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="rules-slider"
        style={{ background: trackBg }}
        aria-label={label}
      />

      {helper && (
        <p className="mt-4 text-sm text-neutral-500">{helper}</p>
      )}
    </div>
  );
}