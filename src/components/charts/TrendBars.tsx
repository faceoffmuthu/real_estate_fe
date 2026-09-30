import type { TrendPoint } from '../../types'

const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC' })
const fullDate = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' })

/** Daily activity bars (last N days) drawn with plain CSS. */
export function TrendBars({ data, label = 'events' }: { data: TrendPoint[]; label?: string }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div>
      <p className="text-3xl font-semibold tracking-tight text-ink tabular-nums">{total}</p>
      <p className="text-xs text-muted">
        {label} in the last {data.length} days
      </p>
      <div className="mt-6 flex h-40 items-end gap-2 sm:gap-3" role="img" aria-label={`Daily ${label} for the last ${data.length} days`}>
        {data.map((point) => {
          const date = new Date(`${point.date}T00:00:00Z`)
          return (
            <div key={point.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[11px] text-muted tabular-nums opacity-0 transition-opacity group-hover:opacity-100">{point.count}</span>
              <div className="flex min-h-0 w-full flex-1 items-end justify-center">
                <div
                  className="w-full max-w-10 rounded-t-md bg-brand-500/85 transition-colors group-hover:bg-brand-500"
                  style={{ height: `${Math.max(point.count === 0 ? 2 : 6, (point.count / max) * 100)}%` }}
                  title={`${fullDate.format(date)}: ${point.count} ${label}`}
                />
              </div>
              <span className="text-[11px] text-muted">{weekday.format(date)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
