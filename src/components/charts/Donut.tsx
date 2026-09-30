interface Segment {
  label: string
  value: number
  color: string
}

/** Simple SVG donut with a legend. Colors are CSS color values (use theme variables). */
export function Donut({ segments, centerLabel }: { segments: Segment[]; centerLabel: string }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const radius = 42
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    // Container query: legend sits beside the donut only when the card is wide enough.
    <div className="@container">
    <div className="flex flex-col items-center gap-6 @sm:flex-row">
      <div className="relative size-32 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label={centerLabel}>
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-surface-3)" strokeWidth="11" />
          {total > 0 &&
            segments.filter((s) => s.value > 0).map((s) => {
              const length = (s.value / total) * circumference
              const dash = `${Math.max(0, length - 1.5)} ${circumference}`
              const circle = (
                <circle
                  key={s.label}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="11"
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                />
              )
              offset += length
              return circle
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-ink tabular-nums">{total}</span>
          <span className="text-[11px] text-muted">{centerLabel}</span>
        </div>
      </div>
      <ul className="w-full space-y-3">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 whitespace-nowrap text-ink-soft">
              <span className="size-2.5 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="font-medium text-ink tabular-nums">
              {s.value}
              <span className="ml-1.5 text-xs font-normal text-muted">{total ? Math.round((s.value / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
    </div>
  )
}
