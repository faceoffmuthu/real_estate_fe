import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, ClipboardCheck, Eye, X, XCircle } from 'lucide-react'
import { ApprovalTimeline } from '../../components/records/ApprovalTimeline'
import { PhoneActions } from '../../components/records/PhoneActions'
import { ApprovalBadge } from '../../components/records/RecordBadges'
import { ApproveDialog, RejectDialog } from '../../components/records/ReviewDialogs'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
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
import { approvalsApi } from '../../services/api'
import type { RecordSummary } from '../../types'
import { formatDateTime, timeAgo } from '../../utils/format'
import { APPROVAL_ACTION_LABELS, formatArea, locationLabel } from '../../utils/records'

const EMPTY = { transaction_type: '', property_category: '', process_stage_id: '', submitted_from: '', submitted_to: '' }

/** Pending approval queue (Admin reviews; Super Admin read-only) + approval history. */
export function ApprovalsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [tab, setTab] = useState<'pending' | 'history'>('pending')

  return (
    <>
      <PageHeader
        title={isAdmin ? 'Pending Approvals' : 'Approvals'}
        description={
          isAdmin
            ? 'Records submitted by your users, oldest first. Review each record and approve or reject it.'
            : 'System-wide approval queue and history (view only — Admins review their own teams).'
        }
      />
      <div className="mb-4 flex gap-1 border-b border-line" role="tablist">
        {(
          [
            ['pending', 'Pending queue'],
            ['history', 'Approval history'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium ${tab === key ? 'border-brand-500 text-brand-500' : 'border-transparent text-muted hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'pending' ? <PendingQueue /> : <HistoryList />}
    </>
  )
}

function PendingQueue() {
  const area = useArea()
  const navigate = useNavigate()
  const masters = useRecordMasters()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(EMPTY)
  const [page, setPage] = useState(1)
  const [approving, setApproving] = useState<RecordSummary | null>(null)
  const [rejecting, setRejecting] = useState<RecordSummary | null>(null)
  const debouncedSearch = useDebounce(search)
  const { data, error, loading, reload } = useApi(
    (signal) => approvalsApi.pending({ search: debouncedSearch, ...filters, page, per_page: 20 }, signal),
    [debouncedSearch, filters, page],
  )

  const setFilter = (key: keyof typeof EMPTY, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(1)
  }
  const hasFilters = search !== '' || JSON.stringify(filters) !== JSON.stringify(EMPTY)
  const done = () => {
    setApproving(null)
    setRejecting(null)
    reload() // reviewed record leaves the queue
  }
  return (
    <div className="card-shadow rounded-xl border border-line bg-surface p-5">
      <div className="space-y-3 border-b border-line p-4">
        <SearchInput
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Search by reference, party, phone, location or submitted by"
          aria-label="Search pending approvals"
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
          <TextField label="Submitted from" type="date" value={filters.submitted_from} onChange={(e) => setFilter('submitted_from', e.target.value)} />
          <TextField label="Submitted to" type="date" value={filters.submitted_to} onChange={(e) => setFilter('submitted_to', e.target.value)} />
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              icon={<X className="size-4" />}
              onClick={() => {
                setSearch('')
                setFilters(EMPTY)
                setPage(1)
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <PageLoader />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="size-5" />}
          title={hasFilters ? 'No pending records match your search' : 'No records waiting for approval'}
          description={hasFilters ? 'Try clearing the filters.' : 'New submissions from users will appear here.'}
        />
      ) : (
        <div className={loading ? 'opacity-60 transition-opacity' : ''}>
          <Table minWidth={1180}>
            <thead>
              <tr>
                <Th>Reference</Th>
                <Th>Classification</Th>
                <Th>Party</Th>
                <Th>Phone</Th>
                <Th>Location</Th>
                <Th>Area</Th>
                <Th>Submitted by</Th>
                <Th>Submitted</Th>
                <Th>Status</Th>
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
                    <p className="max-w-52 truncate text-xs text-muted" title={r.title}>
                      {r.title}
                    </p>
                  </Td>
                  <Td className="whitespace-nowrap">{r.transaction_type ? (r.transaction_type === 'rental' ? 'Rental' : 'Sale') : 'Unclassified'}{r.property_category ? ` · ${r.property_category === 'residential' ? 'Residential' : 'Commercial'}` : ''}</Td>
                  <Td className="max-w-40 truncate font-medium text-ink">{r.party.name}</Td>
                  <Td>
                    <PhoneActions phone={r.party.phone} label={r.party.name} />
                  </Td>
                  <Td className="max-w-44 truncate">{locationLabel(r)}</Td>
                  <Td className="whitespace-nowrap">{formatArea(r.area_sqft)}</Td>
                  <Td className="whitespace-nowrap">{r.created_by.name}</Td>
                  <Td className="whitespace-nowrap" title={formatDateTime(r.approval.submitted_at)}>
                    {timeAgo(r.approval.submitted_at)}
                  </Td>
                  <Td>
                    <ApprovalBadge status={r.approval.status} />
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" icon={<Eye className="size-4" />} onClick={() => navigate(`${area}/records/${r.id}`)} aria-label={`Review ${r.reference}`}>
                        Review
                      </Button>
                      {data.can_review && (
                        <>
                          <Button variant="ghost" size="sm" icon={<XCircle className="size-4 text-danger" />} onClick={() => setRejecting(r)} aria-label={`Reject ${r.reference}`} />
                          <Button variant="ghost" size="sm" icon={<CheckCircle2 className="size-4 text-success" />} onClick={() => setApproving(r)} aria-label={`Approve ${r.reference}`} />
                        </>
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

      <ApproveDialog record={approving} onClose={() => setApproving(null)} onDone={done} />
      <RejectDialog record={rejecting} onClose={() => setRejecting(null)} onDone={done} />
    </div>
  )
}

function HistoryList() {
  const area = useArea()
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const { data, error, loading, reload } = useApi((signal) => approvalsApi.history({ action, page, per_page: 20 }, signal), [action, page])

  return (
    <Card
      title="Approval history"
      subtitle="Every submission, approval and rejection within your scope, newest first."
      action={
        <FilterSelect
          aria-label="Filter history by action"
          value={action}
          onChange={(e) => {
            setAction(e.target.value)
            setPage(1)
          }}
          options={[
            { value: '', label: 'All actions' },
            ...(['submitted', 'resubmitted', 'approved', 'rejected', 'edited', 'created_approved'] as const).map((a) => ({ value: a, label: APPROVAL_ACTION_LABELS[a] })),
          ]}
        />
      }
      bodyClassName="p-0"
    >
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <PageLoader />
      ) : (
        <div className={loading ? 'opacity-60' : ''}>
          <div className="p-5">
            <ApprovalTimeline items={data.items} showRecord recordLink={(id) => `${area}/records/${id}`} />
          </div>
          {data.items.length > 0 && <Pagination data={data.pagination} onPage={setPage} />}
        </div>
      )}
    </Card>
  )
}
