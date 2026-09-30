import { ActivityFeed } from '../activity/ActivityFeed'
import { Avatar } from '../ui/Avatar'
import { RoleBadge, StatusBadge } from '../ui/Badge'
import { Modal } from '../ui/Modal'
import { PageLoader } from '../ui/Spinner'
import { ErrorState } from '../ui/States'
import { useApi } from '../../hooks/useApi'
import { usersApi } from '../../services/api'
import { formatDateTime, timeAgo } from '../../utils/format'

/** Read-only account view (details + recent activity) backed by users/view.php. */
export function AccountDetailModal({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { data, error, loading, reload } = useApi((signal) => usersApi.view(userId, signal), [userId])
  const u = data?.user

  return (
    <Modal open onClose={onClose} size="lg" title="Account details">
      {loading && !data ? (
        <PageLoader />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : u ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={u.name} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-ink">{u.name}</p>
              <p className="truncate text-sm text-muted">@{u.username}</p>
              <div className="mt-2 flex gap-2">
                <RoleBadge role={u.role} />
                <StatusBadge status={u.status} />
              </div>
            </div>
          </div>

          <dl className="grid gap-4 rounded-xl border border-line bg-surface-2 p-4 text-sm sm:grid-cols-2">
            {[
              ['Email', u.email],
              ['Phone', u.phone ?? '—'],
              u.role === 'user' ? ['Assigned admin', u.manager?.name ?? '—'] : ['Users managed', String(u.managed_users_count ?? 0)],
              ['Last login', u.last_login_at ? `${formatDateTime(u.last_login_at)} (${timeAgo(u.last_login_at)})` : 'Never'],
              ['Created', formatDateTime(u.created_at)],
              ['Last updated', formatDateTime(u.updated_at)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="mt-0.5 break-words text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <div>
            <h3 className="mb-3 text-sm font-medium text-ink">Recent activity</h3>
            <ActivityFeed items={data.recent_activity} />
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
