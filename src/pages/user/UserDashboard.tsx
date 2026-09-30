import { FollowUpDashboard } from '../records/FollowUpsPage'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { ActivityFeed } from '../../components/activity/ActivityFeed'
import { ApprovalTimeline } from '../../components/records/ApprovalTimeline'
import { ApprovalStatCards, RecentRecords, RecordTypeCards, RejectedRecords, StageBreakdown } from '../../components/records/RecordStatsWidgets'
import { Avatar } from '../../components/ui/Avatar'
import { StatusBadge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { DashboardSkeleton } from '../../components/ui/DashboardSkeleton'
import { ErrorState } from '../../components/ui/States'
import { useApi } from '../../hooks/useApi'
import { dashboardApi } from '../../services/api'
import { formatDate, timeAgo } from '../../utils/format'

export function UserDashboard() {
  const { data, error, loading, reload } = useApi((signal) => dashboardApi.user(signal))

  if (loading && !data) return <DashboardSkeleton />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data) return null
  const { account, stats } = data

  return (
    <>
      <PageHeader
        title={`Welcome, ${account.name.split(' ')[0]}`}
        description="Your records, their approval status and current process stages."
        actions={
          <Link to="/user/records/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-700">
            <Plus className="size-4" /> New Record
          </Link>
        }
      />

      <RejectedRecords items={data.approvals.rejected} />

      <div className={data.approvals.rejected.length ? 'mt-6' : ''}>
        <ApprovalStatCards stats={data.records} showDraft />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <RecentRecords stats={data.records} className="xl:col-span-2" />
        <Card title="Recent approval activity">
          <ApprovalTimeline items={data.approvals.recent_activity} showRecord recordLink={(id) => `/user/records/${id}`} />
        </Card>
      </div>

      <h2 className="mt-8 mb-4 text-sm font-semibold tracking-wide text-muted uppercase">My records</h2>
      <RecordTypeCards stats={data.records} totalLabel="My total records" />
      <div className="mt-6">
        <StageBreakdown stats={data.records} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="My account" action={<Link to="/profile" className="text-xs font-medium text-brand-500 hover:underline">View profile</Link>}>
          <div className="flex items-center gap-4">
            <Avatar name={account.name} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-ink">{account.name}</p>
              <p className="truncate text-sm text-muted">{account.email}</p>
              <div className="mt-2">
                <StatusBadge status={account.status} />
              </div>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
            <div>
              <dt className="text-xs text-muted">Reporting to</dt>
              <dd className="mt-0.5 text-ink">{account.manager?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Member since</dt>
              <dd className="mt-0.5 text-ink">{formatDate(account.created_at)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Total logins</dt>
              <dd className="mt-0.5 text-ink tabular-nums">{stats.total_logins}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Last login</dt>
              <dd className="mt-0.5 text-ink">{timeAgo(account.last_login_at)}</dd>
            </div>
          </dl>
        </Card>
        <Card
          title="My recent activity"
          className="xl:col-span-2"
          action={<Link to="/user/activity" className="text-xs font-medium text-brand-500 hover:underline">View all</Link>}
        >
          <ActivityFeed items={data.recent_activity.slice(0, 6)} showUser={false} />
        </Card>
      </div>
      <FollowUpDashboard />
    </>
  )
}
