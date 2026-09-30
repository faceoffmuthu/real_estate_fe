import { useState } from 'react'
import { Eye, Pencil, Plus, Power, ShieldCheck, Users } from 'lucide-react'
import { AccountDetailModal } from '../../components/users/AccountDetailModal'
import { UserFormModal } from '../../components/users/UserFormModal'
import { Alert } from '../../components/ui/Alert'
import { Avatar } from '../../components/ui/Avatar'
import { StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { FilterSelect } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { SearchInput } from '../../components/ui/SearchInput'
import { Pagination } from '../../components/ui/Pagination'
import { PageLoader } from '../../components/ui/Spinner'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { Table, Td, Th } from '../../components/ui/Table'
import { useToast } from '../../components/ui/Toast'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'
import { useDebounce } from '../../hooks/useDebounce'
import { ApiError, usersApi } from '../../services/api'
import type { User } from '../../types'
import { formatDate, timeAgo } from '../../utils/format'

interface Props {
  /** Which account type this page manages. */
  role: 'admin' | 'user'
  title: string
  description: string
}

/**
 * Account management list, shared by Super Admin (Admins, Users) and Admin (their Users).
 * The backend scopes results and enforces every action.
 */
export function AccountsPage({ role, title, description }: Props) {
  const { user: actor } = useAuth()
  const notify = useToast()
  const isSuperAdmin = actor?.role === 'super_admin'
  const entity = role === 'admin' ? 'Admin' : 'User'

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [managerId, setManagerId] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [viewingId, setViewingId] = useState<number | null>(null)
  const [toggling, setToggling] = useState<User | null>(null)
  const [toggleBusy, setToggleBusy] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)

  const list = useApi(
    (signal) =>
      usersApi.list(
        { role, status, search: debouncedSearch, manager_id: managerId ? Number(managerId) : undefined, page, per_page: 15 },
        signal,
      ),
    [role, status, debouncedSearch, managerId, page],
  )

  // Super Admin needs the list of Admins for the "Assigned admin" select and filter.
  const admins = useApi(
    (signal) =>
      isSuperAdmin && role === 'user'
        ? usersApi.list({ role: 'admin', per_page: 100 }, signal).then((r) => r.items)
        : Promise.resolve([] as User[]),
    [isSuperAdmin, role],
  )
  const adminOptions = (admins.data ?? []).filter((a) => a.status === 'active').map((a) => ({ id: a.id, name: a.name }))

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    setPage(1)
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (u: User) => {
    setEditing(u)
    setFormOpen(true)
  }

  const confirmToggle = async () => {
    if (!toggling) return
    setToggleBusy(true)
    setToggleError(null)
    try {
      const res = await usersApi.update(toggling.id, { status: toggling.status === 'active' ? 'inactive' : 'active' })
      notify(res.message === 'Account updated' ? `${toggling.name} ${toggling.status === 'active' ? 'deactivated' : 'activated'}` : res.message)
      setToggling(null)
      list.reload()
    } catch (err) {
      setToggleError(err instanceof ApiError ? err.message : 'Could not update the account.')
    } finally {
      setToggleBusy(false)
    }
  }

  const data = list.data
  const hasFilters = !!(search || status || managerId)

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button icon={<Plus className="size-4" />} onClick={openCreate}>
            New {entity}
          </Button>
        }
      />

      <div className="card-shadow rounded-xl border border-line bg-surface p-5">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={(e) => resetPage(setSearch)(e.target.value)}
            placeholder={`Search ${entity.toLowerCase()}s by name, email, username or phone`}
            aria-label="Search"
          />
          {isSuperAdmin && role === 'user' && (
            <FilterSelect
              aria-label="Filter by admin"
              value={managerId}
              onChange={(e) => resetPage(setManagerId)(e.target.value)}
              options={[{ value: '', label: 'All admins' }, ...(admins.data ?? []).map((a) => ({ value: String(a.id), label: a.name }))]}
            />
          )}
          <FilterSelect
            aria-label="Filter by status"
            value={status}
            onChange={(e) => resetPage(setStatus)(e.target.value)}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>

        {list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : !data ? (
          <PageLoader />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={role === 'admin' ? <ShieldCheck className="size-5" /> : <Users className="size-5" />}
            title={hasFilters ? `No ${entity.toLowerCase()}s match your filters` : `No ${entity.toLowerCase()}s yet`}
            description={hasFilters ? 'Try a different search or clear the filters.' : `Create the first ${entity.toLowerCase()} account to get started.`}
            action={!hasFilters && <Button icon={<Plus className="size-4" />} onClick={openCreate}>New {entity}</Button>}
          />
        ) : (
          <div className={list.loading ? 'opacity-60 transition-opacity' : ''}>
            <Table minWidth={860} spacing={isSuperAdmin || actor?.role === 'admin' ? 'comfortable' : 'default'}>
              <thead>
                <tr>
                  <Th>{entity}</Th>
                  <Th>Username</Th>
                  {role === 'user' && isSuperAdmin && <Th>Assigned admin</Th>}
                  <Th>Status</Th>
                  <Th>Last login</Th>
                  <Th>Created</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id} className="hover:bg-brand-50/40">
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{u.name}</p>
                          <p className="truncate text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap">@{u.username}</Td>
                    {role === 'user' && isSuperAdmin && <Td className="whitespace-nowrap">{u.manager?.name ?? '—'}</Td>}
                    <Td>
                      <StatusBadge status={u.status} />
                    </Td>
                    <Td className="whitespace-nowrap">{timeAgo(u.last_login_at)}</Td>
                    <Td className="whitespace-nowrap">{formatDate(u.created_at)}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewingId(u.id)} aria-label={`View ${u.name}`} icon={<Eye className="size-4" />} />
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)} aria-label={`Edit ${u.name}`} icon={<Pencil className="size-4" />} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setToggleError(null)
                            setToggling(u)
                          }}
                          aria-label={`${u.status === 'active' ? 'Deactivate' : 'Activate'} ${u.name}`}
                          title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                          icon={<Power className={`size-4 ${u.status === 'active' ? 'text-success' : 'text-muted'}`} />}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination data={data.pagination} onPage={setPage} />
          </div>
        )}
      </div>

      <UserFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => list.reload()}
        user={editing}
        defaultRole={role}
        admins={adminOptions}
      />

      {viewingId !== null && <AccountDetailModal userId={viewingId} onClose={() => setViewingId(null)} />}

      <Modal
        open={!!toggling}
        onClose={() => setToggling(null)}
        title={toggling?.status === 'active' ? `Deactivate ${entity.toLowerCase()}?` : `Activate ${entity.toLowerCase()}?`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setToggling(null)} disabled={toggleBusy}>
              Cancel
            </Button>
            <Button variant={toggling?.status === 'active' ? 'danger' : 'primary'} onClick={confirmToggle} loading={toggleBusy}>
              {toggling?.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
          </>
        }
      >
        {toggleError && (
          <div className="mb-4">
            <Alert tone="error">{toggleError}</Alert>
          </div>
        )}
        <p className="text-sm text-ink-soft">
          {toggling?.status === 'active' ? (
            <>
              <span className="font-medium text-ink">{toggling?.name}</span> will be signed out immediately and will not be able to log in until
              reactivated.
            </>
          ) : (
            <>
              <span className="font-medium text-ink">{toggling?.name}</span> will be able to log in again.
            </>
          )}
        </p>
      </Modal>
    </>
  )
}
