import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { formatNumber } from '../../utils/format'
import { AnimatedCounter } from './AnimatedCounter'
import { DashboardSparkline, dashboardIconColorForKey } from '../charts/DashboardSparkline'

type Tone = 'brand' | 'neutral' | 'green' | 'amber' | 'red' | 'blue'

interface StatCardProps {
  label: string
  value: number | string
  icon: ReactNode
  tone?: Tone
  hint?: ReactNode
  /** Optional factual share of a parent total (never a fabricated trend). */
  progressValue?: number
  progressTotal?: number
  href?: string
}

export function StatCard({ label, value, icon, tone = 'brand', hint, progressValue, progressTotal, href }: StatCardProps) {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : typeof value === 'string' ? value : 0
  const hasProgress = Number.isFinite(progressValue) && Number.isFinite(progressTotal) && (progressTotal ?? 0) > 0
  const progress = hasProgress ? Math.max(0, Math.min(100, (progressValue! / progressTotal!) * 100)) : 0
  const iconBackground = dashboardIconColorForKey(label)
  const contents = <div className="relative pb-8">
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm font-medium text-muted">{label}</p>
      <span className="stat-card-icon grid size-10 shrink-0 place-items-center rounded-xl shadow-sm" style={{ color: '#fff', backgroundColor: iconBackground }}>{icon}</span>
    </div>
    <div className="mt-3 flex items-end justify-between gap-2">
      <p className="text-3xl font-semibold tracking-tight text-ink tabular-nums">
        {typeof numeric === 'number' ? <AnimatedCounter value={numeric} /> : numeric}
      </p>
    </div>
    <p className="mt-0.5 text-[10px] text-muted" aria-hidden="true">Decorative accent</p>
    {hint && <div className="mt-1 min-h-5 text-xs text-muted">{hint}</div>}
    {hasProgress && <div className="mt-4" role="progressbar" aria-valuemin={0} aria-valuemax={progressTotal} aria-valuenow={progressValue} aria-label={`${formatNumber(progressValue!)} of ${formatNumber(progressTotal!)} (${Math.round(progress)}%)`}>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-3"><div className="stat-card-progress h-full rounded-full bg-brand-500" style={{ width: `${progress}%` }} /></div>
      <p className="mt-1.5 text-[11px] text-muted">{formatNumber(progressValue!)} of {formatNumber(progressTotal!)} total</p>
    </div>}
    <div className="pointer-events-none absolute right-0 bottom-0 w-16">
      <DashboardSparkline colorKey={label} />
      <span className="sr-only">Decorative visual accent, not a trend.</span>
    </div>
  </div>
  const className = 'stat-card card-shadow group relative block overflow-hidden rounded-xl border border-line bg-surface p-5 transition-colors focus-visible:outline-2 focus-visible:outline-brand-500'
  return (
    href ? <Link to={href} className={`${className} hover:border-brand-200 hover:shadow-lg`} aria-label={`${label}: ${numeric}`}>
      <span className={`pointer-events-none absolute top-0 left-0 h-full w-1 ${tone === 'red' ? 'bg-danger' : tone === 'amber' ? 'bg-warning' : tone === 'green' ? 'bg-success' : 'bg-brand-500'} opacity-50 transition-opacity group-hover:opacity-100`} />{contents}
    </Link> : <div className={`${className} hover:border-brand-200 hover:shadow-md`}>
      <span className={`pointer-events-none absolute top-0 left-0 h-full w-1 ${tone === 'red' ? 'bg-danger' : tone === 'amber' ? 'bg-warning' : tone === 'green' ? 'bg-success' : 'bg-brand-500'} opacity-50 transition-opacity group-hover:opacity-100`} />{contents}
    </div>
  )
}
