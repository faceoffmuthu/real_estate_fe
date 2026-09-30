import { useState } from 'react'
import { activityIcon } from '../../components/activity/ActivityFeed'
import { RoleBadge } from '../../components/ui/Badge'
import { FilterSelect } from '../../components/ui/Field'
import { PageHeader } from '../../components/ui/PageHeader'
import { SearchInput } from '../../components/ui/SearchInput'
import { Pagination } from '../../components/ui/Pagination'
import { PageLoader } from '../../components/ui/Spinner'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { Table, Td, Th } from '../../components/ui/Table'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'
import { useDebounce } from '../../hooks/useDebounce'
import { activityApi } from '../../services/api'
import { actionLabel, formatDateTime, timeAgo } from '../../utils/format'

const descriptions = {
  super_admin: 'Complete audit trail of authentication, account and record events across the system.',
  admin: 'Activity by you and the users you manage.',
  user: 'A history of your sign-ins, account and record events.',
}

/** Activity log. Scope (all / team / own) is decided by the backend based on the caller's role. */
export function ActivityPage({ title = 'Activity' }: { title?: string }) {
  const { user } = useAuth()
  const [action, setAction] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)
  const showUser = user?.role !== 'user'

  const { data, error, loading, reload } = useApi(
    (signal) => activityApi.list({ action, search: debouncedSearch, page, per_page: 20 }, signal),
    [action, debouncedSearch, page],
  )

  return (
    <>
      <PageHeader title={title} description={user ? descriptions[user.role] : undefined} />

      <div className="card-shadow rounded-xl border border-line bg-surface p-5">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder={showUser ? 'Search by description or user name' : 'Search by description'}
            aria-label="Search activity"
          />
          <FilterSelect
            aria-label="Filter by action"
            value={action}
            onChange={(e) => {
              setAction(e.target.value)
              setPage(1)
            }}
            options={[{ value: '', label: 'All actions' }, ...(data?.actions ?? []).map((a) => ({ value: a, label: actionLabel(a) }))]}
          />
        </div>

        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data ? (
          <PageLoader />
        ) : data.items.length === 0 ? (
          <EmptyState title="No activity found" description={action || search ? 'Try clearing the filters.' : 'Events will appear here as they happen.'} />
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : ''}>
            <Table minWidth={showUser ? 900 : 640} spacing={user?.role === 'super_admin' || user?.role === 'admin' ? 'comfortable' : 'default'}>
              <thead>
                <tr>
                  <Th>Event</Th>
                  {showUser && <Th>User</Th>}
                  <Th>Details</Th>
                  <Th>IP address</Th>
                  <Th>When</Th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const { icon, tone } = activityIcon(item.action)
                  return (
                    <tr key={item.id} className="hover:bg-brand-50/40">
                      <Td>
                        <div className="flex items-center gap-3">
                          <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${tone}`}>{icon}</span>
                          <span className="font-medium whitespace-nowrap text-ink">{actionLabel(item.action)}</span>
                        </div>
                      </Td>
                      {showUser && (
                        <Td>
                          {item.user ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className="text-ink">{item.user.name}</span>
                              <RoleBadge role={item.user.role} />
                            </div>
                          ) : (
                            <span className="text-muted">Unknown / anonymous</span>
                          )}
                        </Td>
                      )}
                      <Td className="max-w-md">
                        <p className="truncate" title={item.description}>
                          {item.description}
                        </p>
                      </Td>
                      <Td className="font-mono text-xs">{item.ip_address || '—'}</Td>
                      <Td className="whitespace-nowrap">
                        <time dateTime={item.created_at} title={formatDateTime(item.created_at)}>
                          {timeAgo(item.created_at)}
                        </time>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
            <Pagination data={data.pagination} onPage={setPage} />
          </div>
        )}
      </div>
    </>
  )
}
