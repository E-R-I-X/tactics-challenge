interface Option<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex flex-wrap gap-1 rounded-md bg-black/30 p-1"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded px-3 py-1.5 text-sm transition ${
              active
                ? 'bg-[var(--accent)] font-semibold text-[var(--ink)]'
                : 'text-[var(--muted)] hover:text-[var(--chalk)]'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
