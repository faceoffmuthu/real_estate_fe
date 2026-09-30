import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardList } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { FilterSelect, TextField } from '../../components/ui/Field'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { PageLoader } from '../../components/ui/Spinner'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { Table, Td, Th } from '../../components/ui/Table'
import { Card } from '../../components/ui/Card'
import { useApi } from '../../hooks/useApi'
import { useArea } from '../../hooks/useArea'
import { crmApi, interactionTypes, options, label } from '../../services/api/crm'
import { formatDateTime } from '../../utils/format'

export function FollowUpsPage() {
  const area = useArea()
  const [filters, setFilters] = useState({ status: 'pending', type: '', due_from: '', due_to: '' })
  const [page, setPage] = useState(1)
  const list = useApi((signal) => crmApi.list({ ...filters, page }, signal), [filters, page])
  const set = (key: keyof typeof filters, value: string) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1) }
  const isOverdue = (dueAt: string, status: string) => status === 'pending' && new Date(dueAt) < new Date()
  const statusTone = (status: string, overdue: boolean) => overdue ? 'red' : status === 'pending' ? 'amber' : status === 'completed' ? 'green' : 'neutral'

  return <>
    <PageHeader title="Follow-ups" description="Track scheduled calls, meetings and site visits. Open a record to schedule or manage its follow-ups." />
    <section className="card-shadow rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-end gap-3 border-b border-line p-4 sm:p-5">
        <FilterSelect aria-label="Follow-up status" value={filters.status} onChange={(e) => set('status', e.target.value)} options={[{ value: '', label: 'All statuses' }, ...options(['pending', 'completed', 'cancelled'])]} />
        <FilterSelect aria-label="Follow-up type" value={filters.type} onChange={(e) => set('type', e.target.value)} options={[{ value: '', label: 'All types' }, ...options(interactionTypes)]} />
        <TextField label="Due from" type="date" value={filters.due_from} onChange={(e) => set('due_from', e.target.value)} />
        <TextField label="Due to" type="date" value={filters.due_to} onChange={(e) => set('due_to', e.target.value)} />
      </div>
      {list.error ? <div className="p-5"><ErrorState error={list.error} onRetry={list.reload} /></div> : !list.data ? <PageLoader /> : <>
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-3 sm:p-5">
          <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2/60 p-3"><span className="grid size-9 place-items-center rounded-lg bg-warning-soft text-warning"><CalendarClock className="size-4" /></span><div><p className="text-xs text-muted">Pending</p><p className="text-lg font-semibold text-ink">{list.data.summary.pending}</p></div></div>
          <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2/60 p-3"><span className="grid size-9 place-items-center rounded-lg bg-danger-soft text-danger"><AlertTriangle className="size-4" /></span><div><p className="text-xs text-muted">Overdue</p><p className="text-lg font-semibold text-ink">{list.data.summary.overdue}</p></div></div>
          <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2/60 p-3"><span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-500"><ClipboardList className="size-4" /></span><div><p className="text-xs text-muted">Total follow-ups</p><p className="text-lg font-semibold text-ink">{list.data.summary.total}</p></div></div>
        </div>
        {list.data.items.length === 0 ? <div className="p-5"><EmptyState icon={<CheckCircle2 className="size-5" />} title="No follow-ups found" description="No follow-ups match the selected filters." /></div> : <div className={list.loading ? 'opacity-60 transition-opacity' : ''}>
          <Table minWidth={850}>
            <thead><tr><Th>Record</Th><Th>Type</Th><Th>Notes</Th><Th>Assigned to</Th><Th>Due</Th><Th>Status</Th></tr></thead>
            <tbody>{list.data.items.map((followUp) => {
              const overdue = isOverdue(followUp.due_at, followUp.status)
              return <tr key={followUp.id} className="hover:bg-brand-50/40">
                <Td><Link className="font-semibold text-brand-500 hover:underline" to={`${area}/records/${followUp.record_id}`}>{followUp.reference}</Link><p className="mt-1 max-w-64 truncate text-xs text-muted" title={followUp.title}>{followUp.title}</p></Td>
                <Td><Badge tone="brand">{label(followUp.type)}</Badge></Td>
                <Td className="max-w-72"><p className="truncate" title={followUp.notes ?? ''}>{followUp.notes || '—'}</p></Td>
                <Td className="whitespace-nowrap">{followUp.assigned_name}</Td>
                <Td className="whitespace-nowrap">{formatDateTime(followUp.due_at)}</Td>
                <Td><Badge tone={statusTone(followUp.status, overdue)} dot>{overdue ? 'Overdue' : label(followUp.status)}</Badge></Td>
              </tr>
            })}</tbody>
          </Table>
          <Pagination data={list.data.pagination} onPage={setPage} />
        </div>}
      </>}
    </section>
  </>
}

export function FollowUpDashboard() {
  const area = useArea()
  const list = useApi(signal => crmApi.list({ status: 'pending', per_page: 5 }, signal))
  return <Card title="Upcoming & overdue follow-ups" className="mt-6" action={<Link className="text-sm text-brand-500 hover:underline" to={`${area}/follow-ups`}>View all</Link>}>
    {list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : !list.data ? <PageLoader /> : <>
      <p className="mb-3 text-sm text-muted">{list.data.summary.pending} pending Â· {list.data.summary.overdue} overdue</p>
      {!list.data.items.length && <p className="text-sm text-muted">No pending follow-ups.</p>}
      <ul className="divide-y divide-line">{list.data.items.map(f => <li key={f.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><Link className="font-medium text-brand-500 hover:underline" to={`${area}/records/${f.record_id}`}>{f.reference} Â· {label(f.type)}</Link><span>{formatDateTime(f.due_at)} Â· {f.assigned_name}</span></li>)}</ul>
    </>}
  </Card>
}
