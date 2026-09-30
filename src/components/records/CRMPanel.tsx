import { useState, type FormEvent } from 'react'
import { ActivityFeed } from '../activity/ActivityFeed'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { SelectField, TextAreaField, TextField } from '../ui/Field'
import { Pagination } from '../ui/Pagination'
import { ErrorState } from '../ui/States'
import { PageLoader } from '../ui/Spinner'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'
import type { RecordDetail } from '../../types'
import { crmApi, interactionTypes, options, label, type FollowUp } from '../../services/api/crm'
import { formatDateTime } from '../../utils/format'

type Person = {id: number; name: string}
const localDate = (iso: string) => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16) }

export function FollowUpForm({recordId, people, existing, onSaved, onCancel}: {recordId: number; people: Person[]; existing?: FollowUp; onSaved: () => void; onCancel?: () => void}) {
  const [due, setDue] = useState(existing ? localDate(existing.due_at) : '')
  const [assigned, setAssigned] = useState(String(existing?.assigned_to ?? people[0]?.id ?? ''))
  const [type, setType] = useState(existing?.type ?? 'call')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError('')
    const enteredDue = String(new FormData(e.currentTarget).get('due_at') ?? '')
    if (!enteredDue || Number.isNaN(new Date(enteredDue).getTime())) {setError('Enter a valid follow-up date and time.'); return}
    setBusy(true)
    try {
      const payload = {record_id: recordId, assigned_to: Number(assigned), type, notes, due_at: new Date(enteredDue).toISOString().replace('.000Z', 'Z')}
      if (existing) await crmApi.update(existing.id, {...payload, status: existing.status})
      else await crmApi.create(payload)
      setNotes(''); setDue(''); onSaved()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save follow-up.') }
    finally { setBusy(false) }
  }
  return <form onSubmit={submit} className="space-y-4">
    {error && <Alert tone="error">{error}</Alert>}
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField required name="due_at" label="Follow-up date and time" type="datetime-local" value={due} onChange={e => setDue(e.target.value)} hint="Times are shown in your local timezone." />
      <SelectField label="Assigned person" required value={assigned} onChange={e => setAssigned(e.target.value)} options={people.map(p => ({value: String(p.id), label: p.name}))} />
      <SelectField label="Interaction type" value={type} onChange={e => setType(e.target.value)} options={options(interactionTypes)} />
    </div>
    <TextAreaField label="Notes" maxLength={2000} value={notes} onChange={e => setNotes(e.target.value)} />
    <div className="flex gap-2"><Button type="submit" loading={busy}>{existing ? 'Save follow-up' : 'Schedule follow-up'}</Button>{onCancel && <Button variant="secondary" onClick={onCancel}>Cancel</Button>}</div>
  </form>
}

export function RecordFollowUps({recordId, people, canManage, onChanged}: {recordId: number; people: Person[]; canManage: boolean; onChanged: () => void}) {
  const {user} = useAuth()
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<FollowUp | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const list = useApi(signal => crmApi.list({record_id: recordId, page, per_page: 10}, signal), [recordId, page])
  const update = async (f: FollowUp, status: string) => {
    setError(''); setBusy(true)
    try { await crmApi.update(f.id, {status}); list.reload(); onChanged() }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to update follow-up.') }
    finally { setBusy(false) }
  }
  return <Card title="Follow-ups">
    {error && <Alert tone="error">{error}</Alert>}
    {list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : !list.data ? <PageLoader /> : <>
      {list.data.items.length === 0 && <p className="mb-4 text-sm text-muted">No follow-ups scheduled for this record.</p>}
      <div className="divide-y divide-line">{list.data.items.map(f => <div key={f.id} className="space-y-2 py-4 text-sm">
        <div className="flex flex-wrap justify-between gap-2"><strong>{label(f.type)} · {formatDateTime(f.due_at)}</strong><span className={f.status === 'pending' && new Date(f.due_at) < new Date() ? 'text-danger' : 'text-muted'}>{label(f.status)}{f.status === 'pending' && new Date(f.due_at) < new Date() ? ' · Overdue' : ''}</span></div>
        <p className="text-muted">Assigned to {f.assigned_name}</p><p className="whitespace-pre-line break-words">{f.notes}</p>
        {canManage && (user?.role === 'admin' || f.assigned_to === user?.id) && <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setEditing(f)}>Edit</Button>
          {f.status === 'pending' ? <><Button size="sm" disabled={busy} onClick={() => update(f, 'completed')}>Complete</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => update(f, 'cancelled')}>Cancel follow-up</Button></> : <Button size="sm" variant="ghost" disabled={busy} onClick={() => update(f, 'pending')}>Reopen</Button>}
        </div>}
      </div>)}</div>
      <Pagination data={list.data.pagination} onPage={setPage} />
    </>}
    {canManage && <div className="mt-4 border-t border-line pt-5"><h3 className="mb-4 font-semibold">{editing ? 'Edit follow-up' : 'Schedule a follow-up'}</h3><FollowUpForm key={editing?.id ?? 'new'} recordId={recordId} people={people} existing={editing ?? undefined} onCancel={editing ? () => setEditing(null) : undefined} onSaved={() => {setEditing(null); list.reload(); onChanged()}} /></div>}
  </Card>
}

export function CRMPanel({record, people, canManage, onChanged}: {record: RecordDetail; people: Person[]; canManage: boolean; onChanged: () => void}) {
  const [priority, setPriority] = useState(record.priority)
  const [contact, setContact] = useState(record.contact_status)
  const [assigned, setAssigned] = useState(String(record.assigned_to ?? ''))
  const [next, setNext] = useState(record.next_action ?? '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError(''); setMessage('')
    try { await crmApi.save({record_id: record.id, priority, contact_status: contact, assigned_to: assigned ? Number(assigned) : null, next_action: next}); setMessage('CRM details saved.'); onChanged() }
    catch (e) {setError(e instanceof Error ? e.message : 'Unable to save CRM details.')}
    finally {setBusy(false)}
  }
  return <Card title="Contact & next action"><form onSubmit={save} className="space-y-4">
    {error && <Alert tone="error">{error}</Alert>}{message && <Alert tone="success">{message}</Alert>}
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField label="Priority" disabled={!canManage} value={priority} onChange={e => setPriority(e.target.value)} options={options(['low','normal','high','urgent'])} />
      <SelectField label="Contact status" disabled={!canManage} value={contact} onChange={e => setContact(e.target.value)} options={options(['new','attempted','contacted','unreachable','not_interested'])} />
      <SelectField label="Assigned person" disabled={!canManage || (!!record.assigned_to && !people.some(p => p.id === record.assigned_to))} value={assigned} onChange={e => setAssigned(e.target.value)} options={[{value: '', label: 'Unassigned'}, ...people.map(p => ({value: String(p.id), label: p.name})), ...(record.assigned_to && !people.some(p => p.id === record.assigned_to) ? [{value: String(record.assigned_to), label: 'Assigned by your Admin'}] : [])]} />
      <p className="self-center text-sm text-muted">Last contacted: {formatDateTime(record.last_contacted_at)}</p>
    </div>
    <TextAreaField label="Next action" disabled={!canManage} maxLength={500} value={next} onChange={e => setNext(e.target.value)} />
    {canManage && <Button type="submit" loading={busy}>Save CRM details</Button>}
  </form></Card>
}

export function RecordTimeline({recordId, canManage, onChanged, revision}: {recordId: number; canManage: boolean; onChanged: () => void; revision: number}) {
  const [page, setPage] = useState(1)
  const [type, setType] = useState('note')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const list = useApi(signal => crmApi.timeline(recordId, page, signal), [recordId, page, revision])
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true)
    try {await crmApi.activity(recordId, type, description); setDescription(''); setPage(1); list.reload(); onChanged()}
    catch (e) {setError(e instanceof Error ? e.message : 'Unable to save interaction.')}
    finally {setBusy(false)}
  }
  return <Card title="Activity timeline">
    {error && <Alert tone="error">{error}</Alert>}
    {canManage && <form onSubmit={submit} className="mb-6 space-y-4">
      <SelectField label="Log an interaction" value={type} onChange={e => setType(e.target.value)} options={options(['note', ...interactionTypes])} />
      <TextAreaField label="Description / note" hint="Log completed interactions here. Opening a communication app does not confirm contact." required minLength={2} maxLength={255} value={description} onChange={e => setDescription(e.target.value)} />
      <Button type="submit" loading={busy}>Add to timeline</Button>
    </form>}
    {list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : !list.data ? <PageLoader /> : <><ActivityFeed items={list.data.items} /><Pagination data={list.data.pagination} onPage={setPage} /></>}
  </Card>
}
