import { useState } from 'react'
import { Download, FileBarChart2 } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { FilterSelect, TextField } from '../../components/ui/Field'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { SearchInput } from '../../components/ui/SearchInput'
import { PageLoader } from '../../components/ui/Spinner'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { StatCard } from '../../components/ui/StatCard'
import { Table, Td, Th } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'
import { useDebounce } from '../../hooks/useDebounce'
import { reportsApi, usersApi, type ReportsQuery } from '../../services/api'
import { useRecordMasters } from '../../hooks/useRecordMasters'
import { useToast } from '../../components/ui/Toast'
import { formatDate, formatNumber } from '../../utils/format'

type Report = ReportsQuery['report']
const reportOptions: Array<{ value: Report; label: string }> = [
  { value: 'properties', label: 'Properties' }, { value: 'approvals', label: 'Approvals' },
  { value: 'followups', label: 'Follow-ups' }, { value: 'activity', label: 'Activity' },
]
const dateValue = (days: number) => {
  const d = new Date(); d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const label = (value: unknown) => value ? String(value).replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—'
const money = (value: number | null) => value === null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

export function ReportsPage() {
  const { user } = useAuth()
  const notify = useToast()
  const [report, setReportValue] = useState<Report>('properties')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [transaction, setTransaction] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [stage, setStage] = useState('')
  const [createdBy, setCreatedBy] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [priority, setPriority] = useState('')
  const [location, setLocation] = useState('')
  const [followupType, setFollowupType] = useState('')
  const [page, setPage] = useState(1)
  const masters = useRecordMasters()
  const team = useApi((signal) => user?.role === 'user' ? Promise.resolve({ items: [] as Array<{ id: number; name: string }> }) : usersApi.list({ page: 1, per_page: 100, status: 'active' }, signal), [user?.role])
  const debouncedSearch = useDebounce(search)
  const query: ReportsQuery = { report, search: debouncedSearch, from, to, transaction_type: transaction, property_category: category, approval_status: report === 'activity' ? undefined : status, action: report === 'activity' ? status : undefined, process_stage_id: stage, created_by: createdBy, assigned_to: assignedTo, priority, city: location, type: followupType, page, per_page: 25 }
  const summary = useApi((signal) => reportsApi.summary(signal))
  const list = useApi((signal) => reportsApi.list(query, signal), [report, debouncedSearch, from, to, transaction, category, status, stage, createdBy, assignedTo, priority, location, followupType, page])
  const setReport = (next: Report) => { setReportValue(next); setPage(1) }

  const resetPage = (setter: (value: string) => void, value: string) => { setter(value); setPage(1) }
  const exportCsv = async () => {
    try { await reportsApi.downloadCsv({ ...query, page: undefined, per_page: undefined }); notify('Report exported.') }
    catch (error) { notify(error instanceof Error ? error.message : 'Could not export this report.', 'error') }
  }

  const columns: Record<Report, string[]> = {
    properties: ['reference', 'title', 'transaction_type', 'property_category', 'party', 'city', 'approval_status', 'created_by', 'created_at'],
    approvals: ['reference', 'title', 'transaction_type', 'property_category', 'party', 'created_by', 'approval_status', 'submitted_at', 'reviewed_by', 'reviewed_at', 'rejection_reason'],
    followups: ['reference', 'title', 'transaction_type', 'property_category', 'party', 'type', 'status', 'due_at', 'assigned_to'],
    activity: ['created_at', 'performed_by', 'action', 'description', 'reference'],
  }
  const headers: Record<string, string> = { reference: 'Reference', title: 'Property', transaction_type: 'Transaction', property_category: 'Category', party: 'Party', city: 'Location', approval_status: 'Status', created_by: 'Submitted by', created_at: 'Created', submitted_at: 'Submitted', reviewed_by: 'Reviewed by', reviewed_at: 'Reviewed date', rejection_reason: 'Rejection reason', type: 'Type', status: 'Status', due_at: 'Due', assigned_to: 'Assigned to', performed_by: 'Performed by', action: 'Action', description: 'Description' }
  const data = list.data
  const s = summary.data?.stats

  return <>
    <PageHeader title="Reports & Analytics" description="Live, role scoped reports from your property and CRM records." actions={<Button variant="secondary" icon={<Download className="size-4" />} onClick={exportCsv} disabled={!data || data.items.length === 0}>Export CSV</Button>} />
    {summary.error ? <ErrorState error={summary.error} onRetry={summary.reload} /> : !summary.data ? <PageLoader /> : <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Properties', s?.total ?? 0], ['Rental', s?.rental ?? 0], ['Sale', s?.sale ?? 0], ['Residential', s?.residential ?? 0],
          ['Commercial', s?.commercial ?? 0], ['Pending approvals', s?.pending_approvals ?? 0], ['Approved', s?.approved_records ?? 0], ['Rejected', s?.rejected_records ?? 0],
          ['Resubmitted', s?.resubmitted_records ?? 0], ['Total follow-ups', s?.followups_total ?? 0], ['Follow-ups pending', s?.followups_pending ?? 0], ['Follow-ups completed', s?.followups_completed ?? 0],
          ['Follow-ups cancelled', s?.followups_cancelled ?? 0], ['Due today', s?.followups_due_today ?? 0], ['Upcoming', s?.followups_upcoming ?? 0], ['Overdue', s?.followups_overdue ?? 0],
          ...(user?.role === 'super_admin' ? [['Total Admins', s?.admins ?? 0], ['Total Users', s?.users ?? 0]] : []),
        ].map(([name, value]) => <StatCard key={name} label={String(name)} value={Number(value)} icon={<FileBarChart2 className="size-4" />} />)}
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Card title="Transaction and category" subtitle="Actual record counts by classification">
          <div className="grid grid-cols-2 gap-3">{summary.data.by_combination.map((item) => <div key={`${item.transaction_type}-${item.property_category}`} className="rounded-lg border border-line p-3"><p className="text-sm text-muted">{label(item.transaction_type)} · {label(item.property_category)}</p><p className="mt-1 text-2xl font-semibold">{formatNumber(item.total)}</p></div>)}</div>
        </Card>
        <Card title="Records by business stage">
          <div className="space-y-3">{summary.data.by_stage.map((item) => { const max = Math.max(1, ...summary.data!.by_stage.map((x) => x.total)); return <div key={item.id}><div className="mb-1 flex justify-between text-sm"><span>{item.name}</span><span className="tabular-nums">{item.total}</span></div><div className="h-2 overflow-hidden rounded-full bg-surface-3"><div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(item.total ? 3 : 0, item.total / max * 100)}%` }} /></div></div> })}</div>
        </Card>
        <Card title="Approval status" subtitle="Workflow status remains separate from business stage">
          <div className="space-y-3">{summary.data.by_approval.map((item) => { const max = Math.max(1, ...summary.data!.by_approval.map((x) => x.total)); return <div key={item.status}><div className="mb-1 flex justify-between text-sm"><span>{label(item.status)}</span><span className="tabular-nums">{item.total}</span></div><div className="h-2 overflow-hidden rounded-full bg-surface-3"><div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(item.total ? 3 : 0, item.total / max * 100)}%` }} /></div></div> })}</div>
        </Card>
        <Card title="Follow-up status">
          <div className="space-y-3">{[['Pending', s?.followups_pending ?? 0], ['Completed', s?.followups_completed ?? 0], ['Cancelled', s?.followups_cancelled ?? 0], ['Due today', s?.followups_due_today ?? 0], ['Upcoming', s?.followups_upcoming ?? 0], ['Overdue', s?.followups_overdue ?? 0]].map(([name, count]) => <div key={String(name)} className="flex justify-between border-b border-line py-1.5 text-sm"><span>{name}</span><span className="tabular-nums">{count}</span></div>)}</div>
        </Card>
        <Card title="Monthly property activity" subtitle="Property records created in the last six months">
          <div className="flex h-36 items-end gap-3">{summary.data.created_by_month.map((item) => { const max = Math.max(1, ...summary.data!.created_by_month.map((x) => x.total)); return <div key={item.month} className="flex h-full flex-1 flex-col justify-end text-center"><span className="mb-1 text-xs text-muted">{item.total}</span><div className="mx-auto w-full max-w-12 rounded-t bg-brand-500" style={{ height: `${Math.max(item.total ? 5 : 0, item.total / max * 100)}%` }} /><span className="mt-2 text-xs text-muted">{item.month.slice(5)}</span></div> })}</div>
        </Card>
        <Card title="Top locations">
          {summary.data.by_location.length ? <div className="space-y-2">{summary.data.by_location.map((item) => <div key={item.location} className="flex justify-between gap-3 border-b border-line py-2 text-sm"><span className="truncate">{item.location}</span><span>{item.total} <span className="text-muted">· {item.rental} rental / {item.sale} sale</span></span></div>)}</div> : <p className="text-sm text-muted">No location data yet.</p>}
        </Card>
        <Card title="Financial summary" subtitle="Recorded values for active properties">
          <div className="grid gap-3 sm:grid-cols-2">{[
            ['Monthly rental income', summary.data.financial.monthly_rent_total], ['Rental deposits', summary.data.financial.rental_deposit_total],
            ['Sale price total', summary.data.financial.sale_price_total], ['Average sale price / sq.ft.', summary.data.financial.sale_price_per_sqft_avg],
          ].map(([name, value]) => <div key={String(name)} className="rounded-lg border border-line p-3"><p className="text-xs text-muted">{name}</p><p className="mt-1 font-semibold">{money(value as number | null)}</p></div>)}</div>
        </Card>
        {user?.role === 'super_admin' && <Card title="Team performance" className="xl:col-span-2"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{summary.data.user_performance.map((item) => <div key={item.id} className="rounded-lg border border-line p-3"><p className="font-medium">{item.name}</p><p className="mt-1 text-xs text-muted">{item.role} · {item.records_created} created · {item.records_approved} approved · {item.records_rejected} rejected · {item.followups_completed} follow-ups completed</p></div>)}</div></Card>}
      </div>
    </>}
    <Card className="mt-6">
      <div className="space-y-3 border-b border-line pb-4">
        <div className="flex flex-wrap gap-2">{reportOptions.map((option) => <button key={option.value} onClick={() => { setReport(option.value); setPage(1) }} className={`rounded-lg px-3 py-2 text-sm font-medium ${report === option.value ? 'bg-brand-500 text-white' : 'bg-surface-3 text-ink-soft hover:bg-brand-50'}`}>{option.label}</button>)}</div>
        <SearchInput value={search} onChange={(event) => resetPage(setSearch, event.target.value)} placeholder="Search this report" aria-label="Search report" />
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect aria-label="Date range" value="" onChange={(e) => { const today = dateValue(0); const start = e.target.value === 'today' ? today : e.target.value === 'week' ? dateValue(-6) : e.target.value === 'month' ? `${today.slice(0, 7)}-01` : ''; setFrom(start); setTo(e.target.value ? today : ''); setPage(1) }} options={[{value:'',label:'Custom dates'}, {value:'today',label:'Today'}, {value:'week',label:'This week'}, {value:'month',label:'This month'}]} />
          <TextField label="From" type="date" value={from} onChange={(e) => resetPage(setFrom, e.target.value)} />
          <TextField label="To" type="date" value={to} onChange={(e) => resetPage(setTo, e.target.value)} />
          {report !== 'activity' && <>
            <FilterSelect aria-label="Transaction type" value={transaction} onChange={(e) => resetPage(setTransaction, e.target.value)} options={[{value:'',label:'All transaction types'}, {value:'rental',label:'Rental'}, {value:'sale',label:'Sale'}]} />
            <FilterSelect aria-label="Property category" value={category} onChange={(e) => resetPage(setCategory, e.target.value)} options={[{value:'',label:'All categories'}, {value:'residential',label:'Residential'}, {value:'commercial',label:'Commercial'}]} />
          </>}
          {report !== 'activity' && <>
            <FilterSelect aria-label="Business stage" value={stage} onChange={(e) => resetPage(setStage, e.target.value)} options={[{value:'',label:'All stages'}, ...(masters.data?.stages ?? []).map((x) => ({value:String(x.id),label:x.name}))]} />
            <FilterSelect aria-label="Priority" value={priority} onChange={(e) => resetPage(setPriority, e.target.value)} options={[{value:'',label:'All priorities'}, ...['low','normal','high','urgent'].map((x) => ({value:x,label:label(x)}))]} />
            <input aria-label="Location" value={location} onChange={(e) => resetPage(setLocation, e.target.value)} placeholder="Location" className="form-control h-10 w-36 rounded-lg border border-line-strong bg-surface px-3 text-sm" />
            {user?.role !== 'user' && <>
              <FilterSelect aria-label="Created by" value={createdBy} onChange={(e) => resetPage(setCreatedBy, e.target.value)} options={[{value:'',label:'All creators'}, ...(team.data?.items ?? []).map((x) => ({value:String(x.id),label:x.name}))]} />
              <FilterSelect aria-label="Assigned to" value={assignedTo} onChange={(e) => resetPage(setAssignedTo, e.target.value)} options={[{value:'',label:'All assignees'}, ...(team.data?.items ?? []).map((x) => ({value:String(x.id),label:x.name}))]} />
            </>}
          </>}
          {report === 'followups' && <FilterSelect aria-label="Follow-up type" value={followupType} onChange={(e) => resetPage(setFollowupType, e.target.value)} options={[{value:'',label:'All follow-up types'}, ...['call','whatsapp','meeting','site_visit','email','other'].map((x) => ({value:x,label:label(x)}))]} />}
          <FilterSelect aria-label={report === 'followups' ? 'Follow-up status' : report === 'activity' ? 'Activity action' : 'Approval status'} value={status} onChange={(e) => resetPage(setStatus, e.target.value)} options={report === 'followups' ? [{value:'',label:'All statuses'}, {value:'pending',label:'Pending'}, {value:'completed',label:'Completed'}, {value:'cancelled',label:'Cancelled'}] : report === 'activity' ? [{value:'',label:'All actions'}, ...['record.created','record.updated','record.submitted','record.approved','record.rejected','record.resubmitted','follow_up.created','follow_up.updated','follow_up.completed','follow_up.cancelled'].map((x) => ({value:x,label:label(x)}))] : [{value:'',label:'All approvals'}, {value:'pending',label:'Pending'}, {value:'approved',label:'Approved'}, {value:'rejected',label:'Rejected'}]} />
        </div>
      </div>
      {list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : !data ? <PageLoader /> : data.items.length === 0 ? <EmptyState title="No report rows" description="Adjust the filters or select another report." /> : <>
        <div className={list.loading ? 'overflow-x-auto opacity-60' : 'overflow-x-auto'}><Table minWidth={1050}><thead><tr>{columns[report].map((column) => <Th key={column}>{headers[column] ?? column}</Th>)}</tr></thead><tbody>{data.items.map((row, index) => <tr key={String(row.id ?? index)}>{columns[report].map((column) => <Td key={column} className="max-w-64">{column === 'created_at' || column === 'submitted_at' || column === 'due_at' ? formatDate(String(row[column] ?? '')) : column === 'transaction_type' || column === 'property_category' || column === 'approval_status' || column === 'status' || column === 'action' || column === 'type' ? label(row[column]) : String(row[column] ?? '—')}</Td>)}</tr>)}</tbody></Table></div>
        <Pagination data={data.pagination} onPage={setPage} />
      </>}
    </Card>
  </>
}
