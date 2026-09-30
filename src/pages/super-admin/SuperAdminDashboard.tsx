import { FollowUpDashboard } from '../records/FollowUpsPage'
import { Link } from 'react-router-dom'
import { Activity, Building2, KeyRound, ShieldAlert, ShieldCheck, UserCheck, Users } from 'lucide-react'
import { ActivityFeed } from '../../components/activity/ActivityFeed'
import { Donut } from '../../components/charts/Donut'
import { ApprovalTimeline } from '../../components/records/ApprovalTimeline'
import { ApprovalStatCards, RecentRecords, RecordTypeCards, StageBreakdown } from '../../components/records/RecordStatsWidgets'
import { TrendBars } from '../../components/charts/TrendBars'
import { Avatar } from '../../components/ui/Avatar'
import { RoleBadge, StatusBadge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { DashboardSkeleton } from '../../components/ui/DashboardSkeleton'
import { StatCard } from '../../components/ui/StatCard'
import { ErrorState } from '../../components/ui/States'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'
import { dashboardApi, reportsApi } from '../../services/api'
import { timeAgo } from '../../utils/format'

const viewAll = (to: string) => (
  <Link to={to} className="text-xs font-medium text-brand-500 hover:underline">
    View all
  </Link>
)

export function SuperAdminDashboard() {
  const { user } = useAuth()
  const { data, error, loading, reload } = useApi((signal) => dashboardApi.superAdmin(signal))
  const analytics = useApi((signal) => reportsApi.summary(signal))

  if (loading && !data) return <DashboardSkeleton />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data) return null
  const s = data.stats

  return (
    <>
      <PageHeader title={`Welcome, ${user?.name.split(' ')[0]}`} description="System-wide overview of records, accounts, sessions and activity." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Admins" value={s.total_admins} icon={<ShieldCheck className="size-4" />} hint={`${s.active_admins} active`} />
        <StatCard label="Total Users" value={s.total_users} icon={<Users className="size-4" />} tone="neutral" hint={`${s.active_users} active`} />
        <StatCard
          label="Active accounts"
          value={s.active_accounts}
          icon={<UserCheck className="size-4" />}
          tone="green"
          hint={`${s.inactive_accounts} inactive of ${s.total_accounts} total`}
        />
        <StatCard label="Signed-in accounts" value={s.active_sessions} icon={<KeyRound className="size-4" />} tone="blue" hint="Accounts with a valid session" />
      </div>

      <h2 className="mt-8 mb-4 text-sm font-semibold tracking-wide text-muted uppercase">Approvals</h2>
      <ApprovalStatCards stats={data.records} />
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Recently approved" action={viewAll('/super-admin/approvals')}>
          <ApprovalTimeline items={data.approvals.recent_approved} showRecord recordLink={(id) => `/super-admin/records/${id}`} />
        </Card>
        <Card title="Recently rejected" action={viewAll('/super-admin/approvals')}>
          <ApprovalTimeline items={data.approvals.recent_rejected} showRecord recordLink={(id) => `/super-admin/records/${id}`} />
        </Card>
      </div>

      <h2 className="mt-8 mb-4 text-sm font-semibold tracking-wide text-muted uppercase">Records</h2>
      {analytics.data && <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total properties" value={analytics.data.stats.total} icon={<Building2 className="size-4" />} href="/super-admin/records" />
        <StatCard label="Rental" value={analytics.data.stats.rental} icon={<Building2 className="size-4" />} tone="blue" progressValue={analytics.data.stats.rental} progressTotal={analytics.data.stats.total} href="/super-admin/records?transaction_type=rental" />
        <StatCard label="Sale" value={analytics.data.stats.sale} icon={<Building2 className="size-4" />} tone="green" progressValue={analytics.data.stats.sale} progressTotal={analytics.data.stats.total} href="/super-admin/records?transaction_type=sale" />
        <StatCard label="Residential" value={analytics.data.stats.residential} icon={<Building2 className="size-4" />} tone="neutral" progressValue={analytics.data.stats.residential} progressTotal={analytics.data.stats.total} href="/super-admin/records?property_category=residential" />
        <StatCard label="Commercial" value={analytics.data.stats.commercial} icon={<Building2 className="size-4" />} tone="amber" progressValue={analytics.data.stats.commercial} progressTotal={analytics.data.stats.total} href="/super-admin/records?property_category=commercial" />
        <StatCard label="Pending approvals" value={analytics.data.stats.pending_approvals} icon={<Activity className="size-4" />} tone="amber" href="/super-admin/approvals" />
        <StatCard label="Approved records" value={analytics.data.stats.approved_records} icon={<Activity className="size-4" />} tone="green" progressValue={analytics.data.stats.approved_records} progressTotal={analytics.data.stats.total} href="/super-admin/records?approval=approved" />
        <StatCard label="Rejected records" value={analytics.data.stats.rejected_records} icon={<Activity className="size-4" />} tone="red" progressValue={analytics.data.stats.rejected_records} progressTotal={analytics.data.stats.total} href="/super-admin/records?approval=rejected" />
        <StatCard label="Total Admins" value={analytics.data.stats.admins} icon={<ShieldCheck className="size-4" />} />
        <StatCard label="Total Users" value={analytics.data.stats.users} icon={<Users className="size-4" />} tone="neutral" />
        <StatCard label="Follow-ups pending" value={analytics.data.stats.followups_pending} icon={<Activity className="size-4" />} tone="blue" href="/super-admin/follow-ups" />
        <StatCard label="Follow-ups completed" value={analytics.data.stats.followups_completed} icon={<Activity className="size-4" />} tone="green" href="/super-admin/follow-ups" />
        <StatCard label="Follow-ups overdue" value={analytics.data.stats.followups_overdue} icon={<Activity className="size-4" />} tone="red" href="/super-admin/follow-ups" />
      </div>}
      <RecordTypeCards stats={data.records} />
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <StageBreakdown stats={data.records} />
        <RecentRecords stats={data.records} className="xl:col-span-2" />
      </div>

      <h2 className="mt-8 mb-4 text-sm font-semibold tracking-wide text-muted uppercase">System</h2>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="System activity" subtitle="All recorded events per day" className="xl:col-span-2">
          <TrendBars data={data.activity_trend} />
        </Card>
        <Card title="Accounts by role" subtitle="Admins and Users (excluding Super Admin)">
          <Donut
            centerLabel="accounts"
            segments={[
              { label: 'Active Admins', value: s.active_admins, color: 'var(--color-brand-500)' },
              { label: 'Inactive Admins', value: s.total_admins - s.active_admins, color: 'var(--color-brand-200)' },
              { label: 'Active Users', value: s.active_users, color: 'var(--color-chart-2)' },
              { label: 'Inactive Users', value: s.total_users - s.active_users, color: 'var(--color-line-strong)' },
            ]}
          />
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Logins (24h)" value={s.logins_24h} icon={<Activity className="size-4" />} tone="green" />
        <StatCard label="Failed logins (24h)" value={s.failed_logins_24h} icon={<ShieldAlert className="size-4" />} tone="red" />
        <StatCard label="Denied requests (24h)" value={s.denied_requests_24h} icon={<ShieldAlert className="size-4" />} tone="amber" hint="Blocked by role checks" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Recent activity" action={viewAll('/super-admin/activity')} className="xl:col-span-2">
          <ActivityFeed items={data.recent_activity} />
        </Card>
        <Card title="Newest accounts" action={viewAll('/super-admin/users')}>
          {data.recent_accounts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No accounts yet.</p>
          ) : (
            <ul className="space-y-4">
              {data.recent_accounts.map((a) => (
                <li key={a.id} className="flex items-center gap-3">
                  <Avatar name={a.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{a.name}</p>
                    <p className="truncate text-xs text-muted">
                      {a.email} · {timeAgo(a.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <RoleBadge role={a.role} />
                    {a.status === 'inactive' && <StatusBadge status={a.status} />}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <FollowUpDashboard />
    </>
  )
}
