import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, Eye, Pencil, Plus, X } from 'lucide-react'
import { PhoneActions } from '../../components/records/PhoneActions'
import { ApprovalBadge, RecordStatusBadge, StageBadge } from '../../components/records/RecordBadges'
import { Button } from '../../components/ui/Button'
import { FilterSelect, TextField } from '../../components/ui/Field'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { SearchInput } from '../../components/ui/SearchInput'
import { PageLoader } from '../../components/ui/Spinner'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { Table, Td, Th } from '../../components/ui/Table'
import { useApi } from '../../hooks/useApi'
import { useArea } from '../../hooks/useArea'
import { useAuth } from '../../hooks/useAuth'
import { useDebounce } from '../../hooks/useDebounce'
import { useRecordMasters } from '../../hooks/useRecordMasters'
import { recordsApi } from '../../services/api'
import { formatDate } from '../../utils/format'
import { formatArea, locationLabel } from '../../utils/records'

const EMPTY_FILTERS = { priority: '', assigned_to: '', follow_up_status: '', sort: 'newest', transaction_type: '', property_category: '', process_stage_id: '', approval_status: '', created_by: '', city: '', created_from: '', created_to: '', record_status: 'active' }

const descriptions = {
  super_admin: 'All property and business records across every team (view only).',
  admin: 'Records created by you and the users you manage.',
  user: 'Property and business records you have created.',
}

/** Record list. Scope, search, filters and pagination are all handled by the PHP API. */
export function RecordsPage() {
  const { user } = useAuth()
  const area = useArea()
  const navigate = useNavigate()
  const masters = useRecordMasters()
  const [search, setSearch] = useState('')
  // Dashboard cards link here with ?approval=pending|approved|rejected|draft.
  const [params] = useSearchParams()
  const [filters, setFilters] = useState(() => {
    const approval = params.get('approval') ?? ''
    const transaction = params.get('transaction_type') ?? ''
    const category = params.get('property_category') ?? ''
    return {
      ...EMPTY_FILTERS,
      approval_status: ['draft', 'pending', 'approved', 'rejected'].includes(approval) ? approval : '',
      transaction_type: ['rental', 'sale'].includes(transaction) ? transaction : '',
      property_category: ['residential', 'commercial'].includes(category) ? category : '',
    }
  })
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)

  const list = useApi(
    (signal) => recordsApi.list({ search: debouncedSearch, ...filters, page, per_page: 20 }, signal),
    [debouncedSearch, filters, page],
  )

  const setFilter = (key: keyof typeof EMPTY_FILTERS, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(1)
  }
  const hasFilters = search !== '' || JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS)
  const clearFilters = () => {
    setSearch('')
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  const data = list.data
  const canCreate = data?.can_create ?? user?.role !== 'super_admin'
  return (
    <>
      <PageHeader
        title={user?.role === 'user' ? 'My Records' : 'Records'}
        description={user ? descriptions[user.role] : undefined}
        actions={
          canCreate && (
            <Button icon={<Plus className="size-4" />} onClick={() => navigate(`${area}/records/new`)}>
              New Record
            </Button>
          )
        }
      />

      <div className="card-shadow rounded-xl border border-line bg-surface p-5">
        <div className="space-y-3 border-b border-line p-4">
          <SearchInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by reference, title, party, phone, email, location, type or status"
            aria-label="Search records"
          />
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect aria-label="Transaction type" value={filters.transaction_type} onChange={(e) => setFilter('transaction_type', e.target.value)} options={[{ value: '', label: 'All transaction types' }, { value: 'rental', label: 'Rental' }, { value: 'sale', label: 'Sale' }]} />
            <FilterSelect aria-label="Property category" value={filters.property_category} onChange={(e) => setFilter('property_category', e.target.value)} options={[{ value: '', label: 'All categories' }, { value: 'residential', label: 'Residential' }, { value: 'commercial', label: 'Commercial' }]} />
            <FilterSelect
              aria-label="Process stage"
              value={filters.process_stage_id}
              onChange={(e) => setFilter('process_stage_id', e.target.value)}
              options={[{ value: '', label: 'All stages' }, ...(masters.data?.stages ?? []).map((s) => ({ value: String(s.id), label: s.name }))]}
            />
            <FilterSelect
              aria-label="Approval status"
              value={filters.approval_status}
              onChange={(e) => setFilter('approval_status', e.target.value)}
              options={[
                { value: '', label: 'All approvals' },
                ...(user?.role === 'user' ? [{ value: 'draft', label: 'Draft' }] : []),
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
            {user?.role !== 'user' && (
              <FilterSelect
                aria-label="Created by"
                value={filters.created_by}
                onChange={(e) => setFilter('created_by', e.target.value)}
                options={[{ value: '', label: 'All creators' }, ...(data?.creators ?? []).map((c) => ({ value: String(c.id), label: c.name }))]}
              />
            )}
            <FilterSelect
              aria-label="Location"
              value={filters.city}
              onChange={(e) => setFilter('city', e.target.value)}
              options={[{ value: '', label: 'All locations' }, ...(data?.cities ?? []).map((c) => ({ value: c, label: c }))]}
            />
            <FilterSelect
              aria-label="Record status"
              value={filters.record_status}
              onChange={(e) => setFilter('record_status', e.target.value)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' },
                { value: 'all', label: 'All statuses' },
              ]}
            />
            <TextField label="Created from" type="date" value={filters.created_from} max={filters.created_to || undefined} onChange={(e) => setFilter('created_from', e.target.value)} />
            <TextField label="Created to" type="date" value={filters.created_to} min={filters.created_from || undefined} onChange={(e) => setFilter('created_to', e.target.value)} />
            {hasFilters && (
              <Button variant="ghost" size="sm" icon={<X className="size-4" />} onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : !data ? (
          <PageLoader />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={<Building2 className="size-5" />}
            title={hasFilters ? 'No records match your search' : 'No records yet'}
            description={hasFilters ? 'Try a different search term or clear the filters.' : canCreate ? 'Create your first property or business record.' : 'Records created by Admins and Users will appear here.'}
            action={
              hasFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                canCreate && (
                  <Button icon={<Plus className="size-4" />} onClick={() => navigate(`${area}/records/new`)}>
                    New Record
                  </Button>
                )
              )
            }
          />
        ) : (
          <div className={list.loading ? 'opacity-60 transition-opacity' : ''}>
            <Table minWidth={1220}>
              <thead>
                <tr>
                  <Th>Reference</Th>
                  <Th>Classification</Th>
                  <Th>Party</Th>
                  <Th>Phone</Th>
                  <Th>Location</Th>
                  <Th>Area</Th>
                  <Th>Stage</Th>
                  <Th>Approval / Priority</Th>
                  <Th>Created by</Th>
                  <Th>Created</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id} className="hover:bg-brand-50/40">
                    <Td>
                      <Link to={`${area}/records/${r.id}`} className="font-semibold whitespace-nowrap text-brand-500 hover:underline">
                        {r.reference}
                      </Link>
                      <p className="max-w-56 truncate text-xs text-muted" title={r.title}>
                        {r.title}
                      </p>
                    </Td>
                    <Td><div className="flex flex-wrap gap-1"><span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{r.transaction_type ? r.transaction_type[0].toUpperCase() + r.transaction_type.slice(1) : 'Unclassified'}</span>{r.property_category && <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs text-ink-soft">{r.property_category[0].toUpperCase() + r.property_category.slice(1)}</span>}</div></Td>
                    <Td className="max-w-44 truncate font-medium text-ink" title={r.party.name}>
                      {r.party.name}
                    </Td>
                    <Td>
                      <PhoneActions phone={r.party.phone} label={r.party.name} />
                    </Td>
                    <Td className="max-w-48 truncate" title={locationLabel(r)}>
                      {locationLabel(r)}
                    </Td>
                    <Td className="whitespace-nowrap">{formatArea(r.area_sqft)}</Td>
                    <Td>
                      <div className="flex flex-col items-start gap-1">
                        <StageBadge stage={r.process_stage} />
                        <RecordStatusBadge status={r.record_status} />
                      </div>
                    </Td>
                    <Td>
                      <ApprovalBadge status={r.approval.status} /><p className="mt-1 text-xs capitalize text-muted">{r.priority}</p>
                    </Td>
                    <Td className="whitespace-nowrap">{r.created_by.name}</Td>
                    <Td className="whitespace-nowrap">{formatDate(r.created_at)}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`${area}/records/${r.id}`)} aria-label={`View ${r.reference}`} icon={<Eye className="size-4" />} />
                        {canCreate && (
                          <Button variant="ghost" size="sm" onClick={() => navigate(`${area}/records/${r.id}/edit`)} aria-label={`Edit ${r.reference}`} icon={<Pencil className="size-4" />} />
                        )}
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
    </>
  )
}
