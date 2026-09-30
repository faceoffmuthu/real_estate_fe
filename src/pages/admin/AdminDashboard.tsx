import { FollowUpDashboard } from '../records/FollowUpsPage'
import { Link } from 'react-router-dom'
import { Activity, ClipboardCheck, Plus, UserCheck, Users, UserX } from 'lucide-react'
import { ActivityFeed } from '../../components/activity/ActivityFeed'
import { TrendBars } from '../../components/charts/TrendBars'
import { ApprovalTimeline } from '../../components/records/ApprovalTimeline'
import { ApprovalBadge } from '../../components/records/RecordBadges'
import { ApprovalStatCards, RecentRecords, RecordTypeCards, StageBreakdown } from '../../components/records/RecordStatsWidgets'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { DashboardSkeleton } from '../../components/ui/DashboardSkeleton'
import { StatCard } from '../../components/ui/StatCard'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'
import { dashboardApi } from '../../services/api'
import { timeAgo } from '../../utils/format'
import { locationLabel } from '../../utils/records'

const primaryLink = 'inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-700'

export function AdminDashboard() {
  const { user } = useAuth()
  const { data, error, loading, reload } = useApi((signal) => dashboardApi.admin(signal))

  if (loading && !data) return <DashboardSkeleton />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data) return null
  const s = data.stats
  const pendingCount = data.approvals.pagination.total

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.name.split(' ')[0]}`}
        description="Approvals, records and activity for you and the users you manage."
        actions={
          <Link to="/admin/records/new" className={primaryLink}>
            <Plus className="size-4" /> New Record
          </Link>
        }
      />

      {/* Review call-to-action — the Admin's main job in the approval workflow. */}
      <div
        className={`mb-6 flex flex-col gap-4 rounded-xl border-2 p-5 sm:flex-row sm:items-center sm:justify-between ${
          pendingCount ? 'border-warning/40 bg-warning-soft' : 'border-line bg-surface'
        }`}
      >
        <div className="flex items-center gap-4">
          <span className={`grid size-11 shrink-0 place-items-center rounded-lg ${pendingCount ? 'bg-warning text-white' : 'bg-success-soft text-success'}`}>
            <ClipboardCheck className="size-5" />
          </span>
          <div>
            <p className="text-lg font-semibold text-ink">
              {pendingCount ? `${pendingCount} record${pendingCount === 1 ? '' : 's'} waiting for your approval` : 'No records waiting for approval'}
            </p>
            <p className="text-sm text-ink-soft">
              {pendingCount ? 'Submitted by your users — review them in order of submission.' : 'You are all caught up. New submissions will appear here.'}
            </p>
          </div>
        </div>
        {pendingCount > 0 && (
          <Link to="/admin/approvals" className={primaryLink}>
            Review pending approvals
          </Link>
        )}
      </div>

      <ApprovalStatCards stats={data.records} />

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card
          title="Recent submissions"
          subtitle="Oldest waiting first"
          className="xl:col-span-2"
          action={
            <Link to="/admin/approvals" className="text-xs font-medium text-brand-500 hover:underline">
              View queue
            </Link>
          }
        >
          {data.approvals.items.length === 0 ? (
            <EmptyState icon={<ClipboardCheck className="size-5" />} title="Nothing to review" />
          ) : (
            <ul className="divide-y divide-line">
              {data.approvals.items.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link to={`/admin/records/${r.id}`} className="text-sm font-semibold text-brand-500 hover:underline">
                      {r.reference}
                    </Link>
                    <span className="ml-2 text-sm text-ink">{r.title}</span>
                    <p className="truncate text-xs text-muted">
                      {r.created_by.name} · {r.transaction_type ?? 'Unclassified'}{r.property_category ? ` · ${r.property_category}` : ''} · {r.party.name} · {locationLabel(r)} · submitted {timeAgo(r.approval.submitted_at)}
                    </p>
                  </div>
                  <ApprovalBadge status={r.approval.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Recent approval activity">
          <ApprovalTimeline items={data.approvals.recent_activity} showRecord recordLink={(id) => `/admin/records/${id}`} />
        </Card>
      </div>

      <h2 className="mt-8 mb-4 text-sm font-semibold tracking-wide text-muted uppercase">Records</h2>
      <RecordTypeCards stats={data.records} totalLabel="Team records" />
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <RecentRecords stats={data.records} className="xl:col-span-2" />
        <StageBreakdown stats={data.records} />
      </div>

      <h2 className="mt-8 mb-4 text-sm font-semibold tracking-wide text-muted uppercase">Team</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value={s.total_users} icon={<Users className="size-4" />} hint={`${s.new_users_30d} added in the last 30 days`} />
        <StatCard label="Active Users" value={s.active_users} icon={<UserCheck className="size-4" />} tone="green" />
        <StatCard label="Inactive Users" value={s.inactive_users} icon={<UserX className="size-4" />} tone="amber" />
        <StatCard label="Team logins (7d)" value={s.team_logins_7d} icon={<Activity className="size-4" />} tone="blue" hint={`${s.users_active_7d} users signed in this week`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Team activity" subtitle="Events by you and your users">
          <TrendBars data={data.activity_trend} />
        </Card>
        <Card
          title="Recent user activity"
          className="xl:col-span-2"
          action={
            <Link to="/admin/activity" className="text-xs font-medium text-brand-500 hover:underline">
              View all
            </Link>
          }
        >
          <ActivityFeed items={data.recent_activity} />
        </Card>
      </div>
      <FollowUpDashboard />
    </>
  )
}
