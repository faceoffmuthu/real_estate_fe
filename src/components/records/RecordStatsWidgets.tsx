import { Link } from 'react-router-dom'
import { Building2, CheckCircle2, Clock, FilePen, Home, KeyRound, Pencil, XCircle } from 'lucide-react'
import { useArea } from '../../hooks/useArea'
import type { RecordStats, RecordSummary } from '../../types'
import { formatDate } from '../../utils/format'
import { locationLabel } from '../../utils/records'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/States'
import { StatCard } from '../ui/StatCard'
import { ApprovalBadge, StageBadge } from './RecordBadges'

/** "Total records" + counts for every transaction/category combination. */
export function RecordTypeCards({ stats, totalLabel = 'Total records' }: { stats: RecordStats; totalLabel?: string }) {
  const area = useArea()
  const count = (transaction_type: 'rental' | 'sale', property_category: 'residential' | 'commercial') => stats.by_classification.find((x) => x.transaction_type === transaction_type && x.property_category === property_category)?.total ?? 0
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label={totalLabel} value={stats.total} icon={<Building2 className="size-4" />} hint="Active records" />
      <StatCard label="Rental · Residential" value={count('rental', 'residential')} icon={<KeyRound className="size-4" />} progressValue={count('rental', 'residential')} progressTotal={stats.total} href={`${area}/records?transaction_type=rental&property_category=residential`} />
      <StatCard label="Rental · Commercial" value={count('rental', 'commercial')} icon={<KeyRound className="size-4" />} progressValue={count('rental', 'commercial')} progressTotal={stats.total} href={`${area}/records?transaction_type=rental&property_category=commercial`} />
      <StatCard label="Sale · Residential" value={count('sale', 'residential')} icon={<Home className="size-4" />} progressValue={count('sale', 'residential')} progressTotal={stats.total} href={`${area}/records?transaction_type=sale&property_category=residential`} />
      <StatCard label="Sale · Commercial" value={count('sale', 'commercial')} icon={<Home className="size-4" />} progressValue={count('sale', 'commercial')} progressTotal={stats.total} href={`${area}/records?transaction_type=sale&property_category=commercial`} />
    </div>
  )
}

/** Pending / Approved / Rejected (+ Draft for Users) counts, each linking to the filtered record list. */
export function ApprovalStatCards({ stats, showDraft = false }: { stats: RecordStats; showDraft?: boolean }) {
  const area = useArea()
  const a = stats.by_approval
  const cards = [
    ...(showDraft ? [{ key: 'draft', label: 'Drafts', value: a.draft, icon: <FilePen className="size-4" />, tone: 'neutral' as const }] : []),
    { key: 'pending', label: 'Pending approval', value: a.pending, icon: <Clock className="size-4" />, tone: 'amber' as const },
    { key: 'approved', label: 'Approved', value: a.approved, icon: <CheckCircle2 className="size-4" />, tone: 'green' as const },
    { key: 'rejected', label: 'Rejected', value: a.rejected, icon: <XCircle className="size-4" />, tone: 'red' as const },
  ]
  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${showDraft ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
      {cards.map((c) => (
        <Link key={c.key} to={`${area}/records?approval=${c.key}`} className="rounded-xl focus-visible:outline-2 focus-visible:outline-brand-500">
          <StatCard label={c.label} value={c.value} icon={c.icon} tone={c.tone} hint="View records" progressValue={c.value} progressTotal={stats.total} />
        </Link>
      ))}
    </div>
  )
}

/** Rejected records with their reason and a direct "correct & resubmit" action (User dashboard). */
export function RejectedRecords({ items }: { items: RecordSummary[] }) {
  const area = useArea()
  if (items.length === 0) return null
  return (
    <Card title="Needs your attention" subtitle="Rejected records — correct and resubmit them." className="border-2 border-danger/30">
      <ul className="divide-y divide-line">
        {items.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link to={`${area}/records/${r.id}`} className="text-sm font-semibold text-brand-500 hover:underline">
                {r.reference}
              </Link>
              <span className="ml-2 text-sm text-ink">{r.title}</span>
              <p className="mt-1 text-sm text-ink-soft">
                <span className="font-medium text-danger">Reason: </span>
                {r.approval.rejection_reason}
              </p>
              <p className="text-xs text-muted">
                Rejected by {r.approval.reviewed_by?.name ?? 'Admin'} · {formatDate(r.approval.reviewed_at)}
              </p>
            </div>
            <Link
              to={`${area}/records/${r.id}/edit`}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-brand-500 px-3 text-xs font-medium text-white hover:bg-brand-700"
            >
              <Pencil className="size-3.5" /> View / Correct / Resubmit
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** Horizontal bars: active records per process stage. */
export function StageBreakdown({ stats, className = '' }: { stats: RecordStats; className?: string }) {
  const max = Math.max(1, ...stats.by_stage.map((s) => s.total))
  return (
    <Card title="Records by process stage" subtitle="Active records" className={className}>
      <ul className="space-y-3">
        {stats.by_stage.map((s) => (
          <li key={s.id} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-3 text-sm">
            <span className="truncate text-ink-soft">{s.name}</span>
            <span className="h-2 overflow-hidden rounded-full bg-surface-3">
              <span className="block h-full rounded-full bg-brand-500" style={{ width: `${(s.total / max) * 100}%` }} />
            </span>
            <span className="text-right font-medium text-ink tabular-nums">{s.total}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function RecentRecords({ stats, className = '' }: { stats: RecordStats; className?: string }) {
  const area = useArea()
  return (
    <Card
      title="Recent records"
      className={className}
      action={
        <Link to={`${area}/records`} className="text-xs font-medium text-brand-500 hover:underline">
          View all
        </Link>
      }
    >
      {stats.recent.length === 0 ? (
        <EmptyState icon={<Building2 className="size-5" />} title="No records yet" description="New property and business records will appear here." />
      ) : (
        <ul className="divide-y divide-line">
          {stats.recent.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <Link to={`${area}/records/${r.id}`} className="text-sm font-semibold text-brand-500 hover:underline">
                  {r.reference}
                </Link>
                <p className="truncate text-sm text-ink">{r.title}</p>
                <p className="truncate text-xs text-muted">
                  {r.transaction_type ?? 'Unclassified'}{r.property_category ? ` · ${r.property_category}` : ''} · {r.party.name} · {locationLabel(r)} · {formatDate(r.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StageBadge stage={r.process_stage} />
                <ApprovalBadge status={r.approval.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
