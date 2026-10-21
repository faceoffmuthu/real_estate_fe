import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { HeartHandshake, Pencil, Sparkles } from 'lucide-react'
import { clientRequirementsApi, ApiError } from '../../services/api'
import type { ClientRequirement, ClientRequirementPayload } from '../../types'
import { formatCurrency } from '../../utils/records'
import { formatDateTime } from '../../utils/format'
import { useApi } from '../../hooks/useApi'
import { Alert } from '../ui/Alert'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { SelectField, TextAreaField, TextField } from '../ui/Field'
import { EmptyState, ErrorState } from '../ui/States'
import { PageLoader } from '../ui/Spinner'

type Form = Omit<ClientRequirementPayload, 'party_id'>
const blank: Form = { transaction_type: 'rental', property_category: '', preferred_city: '', preferred_locality: '', min_budget: '', max_budget: '', min_bedrooms: '', min_bathrooms: '', min_area_sqft: '', furnishing: '', notes: '', is_active: true }
const toForm = (requirement: ClientRequirement | null): Form => requirement ? {
  transaction_type: requirement.transaction_type, property_category: requirement.property_category ?? '', preferred_city: requirement.preferred_city,
  preferred_locality: requirement.preferred_locality ?? '', min_budget: requirement.min_budget?.toString() ?? '', max_budget: requirement.max_budget?.toString() ?? '',
  min_bedrooms: requirement.min_bedrooms?.toString() ?? '', min_bathrooms: requirement.min_bathrooms?.toString() ?? '', min_area_sqft: requirement.min_area_sqft?.toString() ?? '',
  furnishing: requirement.furnishing ?? '', notes: requirement.notes ?? '', is_active: requirement.is_active,
} : blank
const titleCase = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase())

function RequirementForm({ partyId, requirement, onSaved }: { partyId: number; requirement: ClientRequirement | null; onSaved: () => void }) {
  const [form, setForm] = useState<Form>(() => toForm(requirement))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => setForm(toForm(requirement)), [requirement])
  const set = (key: keyof Form, value: string | boolean) => { setForm(current => ({ ...current, [key]: value } as Form)); setErrors(current => ({ ...current, [key]: '' })) }
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setFormError(''); setErrors({})
    try { await clientRequirementsApi.save({ party_id: partyId, ...form }); onSaved() }
    catch (error) { if (error instanceof ApiError && error.isValidation) setErrors(error.errors); setFormError(error instanceof Error ? error.message : 'Could not save client requirements.') }
    finally { setSaving(false) }
  }
  return <form onSubmit={submit} className="space-y-4">
    {formError && <Alert tone="error">{formError}</Alert>}
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField required label="Looking to" value={form.transaction_type} error={errors.transaction_type} onChange={event => set('transaction_type', event.target.value)} options={[{ value: 'rental', label: 'Rent' }, { value: 'sale', label: 'Buy' }]} />
      <SelectField label="Property category" value={form.property_category} error={errors.property_category} onChange={event => set('property_category', event.target.value)} options={[{ value: '', label: 'Any category' }, { value: 'residential', label: 'Residential' }, { value: 'commercial', label: 'Commercial' }]} />
      <TextField required label="Preferred city" maxLength={100} value={form.preferred_city} error={errors.preferred_city} onChange={event => set('preferred_city', event.target.value)} />
      <TextField label="Preferred locality" maxLength={100} value={form.preferred_locality} error={errors.preferred_locality} onChange={event => set('preferred_locality', event.target.value)} />
      <TextField label="Minimum budget" inputMode="decimal" placeholder="Optional" value={form.min_budget} error={errors.min_budget} onChange={event => set('min_budget', event.target.value)} />
      <TextField label="Maximum budget" inputMode="decimal" placeholder="Optional" value={form.max_budget} error={errors.max_budget} onChange={event => set('max_budget', event.target.value)} />
      <TextField label="Minimum bedrooms" inputMode="numeric" value={form.min_bedrooms} error={errors.min_bedrooms} onChange={event => set('min_bedrooms', event.target.value)} />
      <TextField label="Minimum bathrooms" inputMode="numeric" value={form.min_bathrooms} error={errors.min_bathrooms} onChange={event => set('min_bathrooms', event.target.value)} />
      <TextField label="Minimum area (sq.ft.)" inputMode="decimal" value={form.min_area_sqft} error={errors.min_area_sqft} onChange={event => set('min_area_sqft', event.target.value)} />
      <SelectField label="Furnishing" value={form.furnishing} error={errors.furnishing} onChange={event => set('furnishing', event.target.value)} options={[{ value: '', label: 'Any furnishing' }, ...['unfurnished', 'semi_furnished', 'fully_furnished'].map(value => ({ value, label: titleCase(value) }))]} />
    </div>
    <TextAreaField label="Requirement notes" maxLength={2000} value={form.notes} error={errors.notes} onChange={event => set('notes', event.target.value)} />
    <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={form.is_active} onChange={event => set('is_active', event.target.checked)} /> Include this requirement in matching</label>
    <Button type="submit" loading={saving}>{requirement ? 'Update requirements' : 'Save requirements'}</Button>
  </form>
}

function RequirementSummary({ requirement }: { requirement: ClientRequirement }) {
  const budget = requirement.min_budget !== null || requirement.max_budget !== null ? `${formatCurrency(requirement.min_budget)} – ${formatCurrency(requirement.max_budget)}` : 'Any budget'
  return <div className="space-y-3 text-sm"><div className="flex flex-wrap gap-2"><Badge tone={requirement.is_active ? 'green' : 'neutral'}>{requirement.is_active ? 'Matching active' : 'Matching paused'}</Badge><Badge tone="brand">{requirement.transaction_type === 'rental' ? 'Rent' : 'Buy'}</Badge>{requirement.property_category && <Badge>{titleCase(requirement.property_category)}</Badge>}</div><p className="font-medium text-ink">{[requirement.preferred_locality, requirement.preferred_city].filter(Boolean).join(', ')}</p><p className="text-muted">Budget: {budget}</p><p className="text-muted">{[requirement.min_bedrooms !== null ? `${requirement.min_bedrooms}+ beds` : null, requirement.min_bathrooms !== null ? `${requirement.min_bathrooms}+ baths` : null, requirement.min_area_sqft !== null ? `${requirement.min_area_sqft.toLocaleString('en-IN')}+ sq.ft.` : null, requirement.furnishing ? titleCase(requirement.furnishing) : null].filter(Boolean).join(' · ') || 'No additional preferences'}</p>{requirement.notes && <p className="border-t border-line pt-3 whitespace-pre-line text-ink-soft">{requirement.notes}</p>}<p className="text-xs text-muted">Updated {formatDateTime(requirement.updated_at)}</p></div>
}

export function ClientRequirementPanel({ partyId, canManage, area }: { partyId: number; canManage: boolean; area: string }) {
  const [editing, setEditing] = useState(false)
  const detail = useApi(signal => clientRequirementsApi.view(partyId, signal), [partyId])
  const matches = useApi(signal => clientRequirementsApi.propertyMatches(partyId, signal), [partyId, detail.data?.requirement?.updated_at])
  if (detail.error) return <Card title="Client requirements"><ErrorState error={detail.error} onRetry={detail.reload} /></Card>
  if (!detail.data) return <Card title="Client requirements"><PageLoader /></Card>
  const requirement = detail.data.requirement
  return <Card title="Client requirements" subtitle="Preferences used to find suitable approved properties." action={canManage && requirement && !editing ? <Button size="sm" variant="secondary" icon={<Pencil className="size-3.5" />} onClick={() => setEditing(true)}>Edit</Button> : undefined}>
    {editing || !requirement ? (canManage ? <RequirementForm partyId={partyId} requirement={requirement} onSaved={() => { setEditing(false); detail.reload(); matches.reload() }} /> : <EmptyState title="No client requirement saved" description="Only the party's team can add requirements." />) : <>
      <RequirementSummary requirement={requirement} />
      {requirement.is_active && <div className="mt-5 border-t border-line pt-4"><div className="mb-3 flex items-center gap-2"><Sparkles className="size-4 text-brand-500" /><h3 className="font-semibold text-ink">Best property matches</h3></div>{matches.error ? <ErrorState error={matches.error} onRetry={matches.reload} /> : !matches.data ? <PageLoader /> : matches.data.items.length === 0 ? <p className="text-sm text-muted">No approved properties in this client’s preferred city yet.</p> : <div className="space-y-3">{matches.data.items.slice(0, 5).map(match => <Link key={match.record.id} to={`${area}/records/${match.record.id}`} className="block rounded-lg border border-line p-3 transition hover:border-brand-200 hover:bg-brand-50"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-brand-500">{match.record.reference}</p><p className="max-w-80 truncate text-sm text-ink">{match.record.title}</p></div><Badge tone={match.score >= 80 ? 'green' : match.score >= 65 ? 'brand' : 'amber'}>{match.score}% match</Badge></div><p className="mt-2 text-xs text-muted">{match.reasons.join(' · ')}</p></Link>)}</div>}</div>}
    </>}
  </Card>
}

export function PropertyClientMatches({ recordId, area }: { recordId: number; area: string }) {
  const matches = useApi(signal => clientRequirementsApi.clientMatches(recordId, signal), [recordId])
  return <Card title="Matching clients" subtitle="Active client requirements that fit this property."><div className="mb-4 flex items-center gap-2 text-sm text-muted"><HeartHandshake className="size-4 text-brand-500" />Matches use transaction type, city, category, locality, budget and property preferences.</div>{matches.error ? <ErrorState error={matches.error} onRetry={matches.reload} /> : !matches.data ? <PageLoader /> : matches.data.items.length === 0 ? <EmptyState title="No matching clients yet" description="Add client requirements from a party profile to surface matches here." /> : <div className="space-y-3">{matches.data.items.map(match => <Link key={match.party.id} to={`${area}/parties/${match.party.id}`} className="block rounded-lg border border-line p-3 transition hover:border-brand-200 hover:bg-brand-50"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-brand-500">{match.party.name}</p><p className="text-xs text-muted">{match.party.phone}{match.party.email ? ` · ${match.party.email}` : ''}</p></div><Badge tone={match.score >= 80 ? 'green' : match.score >= 65 ? 'brand' : 'amber'}>{match.score}% match</Badge></div><p className="mt-2 text-xs text-muted">{match.reasons.join(' · ')}</p></Link>)}</div>}</Card>
}
