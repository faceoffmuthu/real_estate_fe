import { useEffect } from 'react'
import { Avatar } from '../../components/ui/Avatar'
import { RoleBadge, StatusBadge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAuth } from '../../hooks/useAuth'
import { formatDateTime } from '../../utils/format'

/** Read-only profile for the currently authenticated account. */
export function ProfilePage({ title = 'My Profile', description = 'Your account information.' }: { title?: string; description?: string }) {
  const { user, refresh } = useAuth()

  // Re-fetch so details such as last login are current.
  useEffect(() => {
    void refresh()
  }, [refresh])

  if (!user) return null

  const rows: Array<[string, string]> = [
    ['Full name', user.name],
    ['Username', `@${user.username}`],
    ['Email', user.email],
    ['Phone', user.phone ?? '—'],
    ['Role', user.role_name],
    ...(user.role === 'user' ? ([['Assigned admin', user.manager?.name ?? '—']] as Array<[string, string]>) : []),
    ['Last login', formatDateTime(user.last_login_at)],
    ['Member since', formatDateTime(user.created_at)],
  ]

  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="mx-auto w-full max-w-4xl">
        <Card className="min-h-[390px] w-full" bodyClassName="min-h-[330px] p-6 sm:p-8" title="Account information" subtitle="These details belong to your authenticated account.">
          <div className="flex flex-col items-center gap-4 border-b border-line pb-5 text-center sm:flex-row sm:text-left">
            <Avatar name={user.name} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-ink">{user.name}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                <RoleBadge role={user.role} />
                <StatusBadge status={user.status} />
              </div>
            </div>
          </div>
          <dl className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="mt-0.5 text-sm break-words text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  )
}
