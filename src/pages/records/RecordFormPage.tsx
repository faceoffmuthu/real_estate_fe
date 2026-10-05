import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, LoaderCircle, Save, Send, UserRoundCheck, UserRoundPlus } from 'lucide-react'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { SelectField, TextField } from '../../components/ui/Field'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageLoader } from '../../components/ui/Spinner'
import { ErrorState } from '../../components/ui/States'
import { RecordMediaPicker } from '../../components/records/RecordMediaPicker'
import { useToast } from '../../components/ui/Toast'
import { useApi } from '../../hooks/useApi'
import { useArea } from '../../hooks/useArea'
import { useAuth } from '../../hooks/useAuth'
import { useRecordMasters } from '../../hooks/useRecordMasters'
import { ApiError, locationsApi, partiesApi, recordsApi } from '../../services/api'
import type { AreaUnit, Furnishing, PartyPayload, RecordDetail, RecordPayload, RecordStatus, StoredAreaUnit } from '../../types'
import { FURNISHING_LABELS, formatPhone } from '../../utils/records'
import { rules, validate, type FieldErrors } from '../../utils/validation'

type FormState = Omit<RecordPayload, 'property_type_id' | 'property_category_id' | 'process_stage_id' | 'party_id' | 'party_phone' | 'party' | 'confirm_new_party' | 'area_unit' | 'process_notes' | 'description'> & {
  property_type_id: string
  property_category_id: string
  transaction_type: 'rental' | 'sale' | ''
  property_category: 'residential' | 'commercial' | ''
  process_stage_id: string
  record_status: RecordStatus
  area_unit: StoredAreaUnit
}
type PartyForm = Required<Omit<PartyPayload, 'notes'>>
type PartyRef = { id: number; name: string; phone: string }

const EMPTY_FORM: FormState = {
  title: '', property_type_id: '', transaction_type: '', property_category_id: '', property_category: '',
  address_line: '', locality: '', city: '', district: '', state: '', pincode: '', map_url: '',
  area_sqft: '', area_value: '', area_unit: 'sq_ft', dimensions: '', floor_details: '', property_facing: '', bedrooms: '', bathrooms: '', furnishing: '',
  commercial_usage: '', rental_amount: '', security_deposit: '', sale_amount: '', market_price: '',
  process_stage_id: '', record_status: 'active',
}
const EMPTY_PARTY: PartyForm = { name: '', phone: '', alt_phone: '', email: '', address: '' }
const AREA_UNITS: AreaUnit[] = ['sq_ft', 'acre', 'cent']
const isNewAreaUnit = (unit: StoredAreaUnit): unit is AreaUnit => AREA_UNITS.includes(unit as AreaUnit)

const str = (v: string | number | null | undefined) => (v == null ? '' : String(v))

function fromRecord(r: RecordDetail): FormState {
  return {
    title: r.title, property_type_id: str(r.property_type.id), transaction_type: r.transaction_type ?? '', property_category_id: r.property_category_id ? str(r.property_category_id) : '', property_category: r.property_category ?? '',
    address_line: str(r.address_line), locality: str(r.locality), city: r.city, district: str(r.district), state: str(r.state), pincode: str(r.pincode), map_url: str(r.map_url),
    area_sqft: '', area_value: str(r.area_value ?? r.area_sqft), area_unit: r.area_unit ?? 'sq_ft', dimensions: str(r.dimensions), floor_details: str(r.floor_details), property_facing: r.property_facing ?? '',
    bedrooms: str(r.bedrooms), bathrooms: str(r.bathrooms), furnishing: r.furnishing ?? '', commercial_usage: str(r.commercial_usage),
    rental_amount: str(r.rental_amount), security_deposit: str(r.security_deposit), sale_amount: str(r.sale_amount), market_price: str(r.market_price),
    process_stage_id: str(r.process_stage.id), record_status: r.record_status,
  }
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <Card title={title} subtitle={subtitle}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </Card>
  )
}

export function RecordFormPage() {
  const { id } = useParams()
  const recordId = id ? Number(id) : null
  const isEdit = recordId !== null
  const area = useArea()
  const navigate = useNavigate()
  const notify = useToast()
  const masters = useRecordMasters()
  const locations = useApi((signal) => locationsApi.india(signal), [])
  const existing = useApi((signal) => (recordId ? recordsApi.view(recordId, signal) : Promise.resolve(null)), [recordId])

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [selectedParty, setSelectedParty] = useState<PartyRef | null>(null)
  const [partyForm, setPartyForm] = useState<PartyForm>(EMPTY_PARTY)
  const [matches, setMatches] = useState<PartyRef[] | null>(null)
  const [confirmNewParty, setConfirmNewParty] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [mapLookupStatus, setMapLookupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [mapLookupMessage, setMapLookupMessage] = useState('')
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [cities, setCities] = useState<string[]>([])
  const initialized = useRef(false)
  const submitIntent = useRef(false)
  const mapLookupTimer = useRef<number | null>(null)
  const mapLookupSequence = useRef(0)
  const mapAutoFilled = useRef<Partial<Record<'address_line' | 'locality' | 'city' | 'district' | 'state' | 'pincode', string>>>({})
  const { user } = useAuth()
  const partySection = useRef<HTMLDivElement>(null)
  const mediaSection = useRef<HTMLDivElement>(null)

  // Offer existing CRM cities as native suggestions while keeping City free-form.
  useEffect(() => {
    const controller = new AbortController()
    locationsApi.cities('', controller.signal)
      .then((result) => setCities(result.items))
      .catch(() => { if (!controller.signal.aborted) setCities([]) })
    return () => controller.abort()
  }, [])

  // Populate once: from the existing record (edit) or with the first stage (create).
  useEffect(() => {
    if (initialized.current) return
    if (isEdit && existing.data) {
      setForm(fromRecord(existing.data.record))
      setSelectedParty({ id: existing.data.party.id, name: existing.data.party.name, phone: existing.data.party.phone })
      initialized.current = true
    } else if (!isEdit && masters.data) {
      setForm((f) => ({ ...f, process_stage_id: str(masters.data!.stages[0]?.id) }))
      initialized.current = true
    }
  }, [isEdit, existing.data, masters.data])

  const clearError = (key: string) =>
    setErrors((e) => {
      if (!e[key]) return e
      const next = { ...e }
      delete next[key]
      return next
    })

  // Approval workflow: approved User records only allow stage + notes ("progress") edits.
  const approvalStatus = existing.data?.record.approval.status
  const locked = existing.data?.edit_mode === 'progress'
  const isUser = user?.role === 'user'
  // New records, drafts and rejected records can be (re)submitted by their User.
  const canSubmitFromForm = !isEdit || approvalStatus === 'draft' || approvalStatus === 'rejected'

  const field = <K extends keyof FormState>(key: K) => ({
    value: form[key] as string,
    error: errors[key],
    disabled: locked && key !== 'process_stage_id',
    onChange: (e: { target: { value: string } }) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
      clearError(key)
    },
  })
  const partyField = (key: keyof PartyForm) => ({
    value: partyForm[key],
    error: errors[`party_${key}`],
    disabled: locked,
    onChange: (e: { target: { value: string } }) => {
      setPartyForm((p) => ({ ...p, [key]: e.target.value }))
      clearError(`party_${key}`)
      if (key === 'phone') {
        setMatches(null)
        setConfirmNewParty(false)
      }
    },
  })

  // An existing record may use a since-deactivated type, which is not in the active list.
  const group = form.property_category
  const shows = (name: string) => {
    const categoryFields = group === 'residential' ? ['bedrooms', 'bathrooms', 'furnishing'] : group === 'commercial' ? ['commercial_usage', 'furnishing'] : []
    return categoryFields.includes(name) || (form.transaction_type === 'rental' && ['rental_amount', 'security_deposit'].includes(name)) || (form.transaction_type === 'sale' && ['sale_amount', 'market_price'].includes(name))
  }

  const updateMapUrl = (value: string) => {
    setForm((f) => ({ ...f, map_url: value }))
    clearError('map_url')
    if (mapLookupTimer.current !== null) window.clearTimeout(mapLookupTimer.current)
    const sequence = ++mapLookupSequence.current
    const isMapLink = /^https:\/\/(?:www\.|maps\.)?google\.com\/maps|^https:\/\/maps\.app\.goo\.gl\/|^https:\/\/goo\.gl\/maps\//i.test(value.trim())
    if (!isMapLink) {
      setMapLookupStatus('idle')
      setMapLookupMessage('')
      return
    }
    setMapLookupStatus('loading')
    setMapLookupMessage('Looking up the address from this map link…')
    mapLookupTimer.current = window.setTimeout(async () => {
      try {
        const response = await recordsApi.lookupMap(value.trim())
        if (sequence !== mapLookupSequence.current) return
        const location = response.location
        const matchedState = locations.data?.states.find((state) => state.toLowerCase() === (location.state ?? '').trim().toLowerCase()) ?? ''
        const allDistricts = Object.values(locations.data?.districts ?? {}).flat()
        const matchedDistrict = (locations.data?.districts[matchedState] ?? []).find((district) => district.toLowerCase() === (location.district ?? '').trim().toLowerCase()) ?? allDistricts.find((district) => district.toLowerCase() === (location.district ?? '').trim().toLowerCase()) ?? ''
        const fetched = {
          address_line: location.address_line ?? '',
          locality: location.locality ?? '',
          city: location.city ?? '',
          district: matchedDistrict,
          state: matchedState,
          pincode: location.pincode ?? '',
        }
        setForm((current) => {
          const next = { ...current }
          const nextAutoFilled = { ...mapAutoFilled.current }
          for (const key of Object.keys(fetched) as Array<keyof typeof fetched>) {
            const currentValue = current[key]
            const previousAutoValue = mapAutoFilled.current[key]
            // Fill blanks or refresh values previously filled by a map lookup;
            // preserve anything the user typed manually.
            if (!currentValue || currentValue === previousAutoValue) {
              next[key] = fetched[key]
              nextAutoFilled[key] = fetched[key]
            } else {
              delete nextAutoFilled[key]
            }
          }
          mapAutoFilled.current = nextAutoFilled
          return next
        })
        setMapLookupStatus('success')
        setMapLookupMessage('Address fetched successfully. Review the available details before saving.')
      } catch (error) {
        if (sequence !== mapLookupSequence.current) return
        setMapLookupStatus('error')
        setMapLookupMessage(error instanceof ApiError ? error.message : 'Could not look up this map link. You can enter the location manually.')
      }
    }, 650)
  }

  useEffect(() => () => {
    if (mapLookupTimer.current !== null) window.clearTimeout(mapLookupTimer.current)
    mapLookupSequence.current++
  }, [])

  /** Looks for existing parties with the entered phone and offers reuse. */
  const checkPhone = async (force = false) => {
    if (selectedParty || !/^\d{10}$/.test(partyForm.phone)) return
    if (confirmNewParty && !force) return
    try {
      const res = await partiesApi.lookup(partyForm.phone)
      setMatches(res.matches.length ? res.matches : null)
    } catch {
      // Lookup is a convenience; the backend still enforces the duplicate check on save.
    }
  }

  const linkParty = (party: PartyRef) => {
    setSelectedParty(party)
    setMatches(null)
    setConfirmNewParty(false)
    clearError('party_id')
    clearError('party_phone')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    // Which button was used: "Submit for approval" / "Save & resubmit" set this.
    const submit = submitIntent.current
    submitIntent.current = false
    setFormError(null)
    const checks: Record<string, Array<string | null>> = {
      title: [rules.required(form.title, 'Title'), rules.length(form.title, 'Title', 3, 200)],
      property_type_id: [rules.required(form.property_type_id, 'Property type')],
      transaction_type: [rules.required(form.transaction_type, 'Property type')],
      property_category: [rules.required(form.property_category, 'Property category')],
      map_url: [locked ? null : rules.required(form.map_url, 'Google Maps link')],
      city: [rules.length(form.city, 'City', 2, 100)],
      pincode: [rules.pincode(form.pincode)],
      area_value: [rules.number(form.area_value, 'Area', 1, 100_000_000)],
      process_stage_id: [rules.required(form.process_stage_id, 'Process stage')],
    }
    if (shows('rental_amount')) checks.rental_amount = [rules.required(form.rental_amount, 'Rent amount'), rules.number(form.rental_amount, 'Rent amount', 0, 1e12)]
    if (shows('security_deposit')) checks.security_deposit = [rules.number(form.security_deposit, 'Security deposit', 0, 1e12)]
    if (shows('sale_amount')) {
      checks.sale_amount = [rules.number(form.sale_amount, 'Expected price', 0, 1e12)]
      checks.market_price = [rules.number(form.market_price, 'Market price', 0, 1e12)]
    }
    if (shows('bedrooms')) checks.bedrooms = [rules.number(form.bedrooms, 'Bedrooms', 0, 50, true)]
    if (shows('bathrooms')) checks.bathrooms = [rules.number(form.bathrooms, 'Bathrooms', 0, 50, true)]
    if (!selectedParty) {
      checks.party_name = [rules.required(partyForm.name, 'Party name'), rules.length(partyForm.name, 'Party name', 2, 150)]
      checks.party_phone = [rules.required(partyForm.phone, 'Phone'), rules.localPhone(partyForm.phone)]
      checks.party_alt_phone = [rules.localPhone(partyForm.alt_phone, true)]
      checks.party_email = [rules.email(partyForm.email)]
    }
    const clientErrors = validate(checks)
    if (!locked && !isEdit && mediaFiles.length === 0) clientErrors.media = 'Add at least one property image or video.'
    if (!locked && isEdit && (existing.data?.media.length ?? 0) + mediaFiles.length === 0) clientErrors.media = 'Add at least one property image or video.'
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      setFormError('Please correct the highlighted fields.')
      if (clientErrors.media) mediaSection.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      else window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const payload: RecordPayload = {
      ...form,
      property_type_id: Number(form.property_type_id),
      transaction_type: form.transaction_type,
      property_category_id: Number(form.property_category_id),
      property_category: form.property_category,
      process_stage_id: Number(form.process_stage_id),
      area_unit: isNewAreaUnit(form.area_unit) ? form.area_unit : '',
      furnishing: form.furnishing as Furnishing | '',
      ...(selectedParty
        ? { party_id: selectedParty.id, party_phone: selectedParty.phone }
        : { party: partyForm, confirm_new_party: confirmNewParty }),
    }
    // Historical units remain unchanged unless the editor chooses one of the
    // currently supported units from the dropdown.
    if (isEdit && !isNewAreaUnit(form.area_unit)) delete payload.area_unit
    if (!isEdit) delete payload.record_status
    if (submit) payload.submit = true
    delete payload.process_notes
    delete payload.description

    setSaving(true)
    try {
      if (isEdit && mediaFiles.length) {
        await recordsApi.uploadMedia(recordId!, mediaFiles)
        setMediaFiles([])
        await existing.reload()
      }
      const res = isEdit ? await recordsApi.update(recordId!, payload) : await recordsApi.createWithMedia(payload, mediaFiles)
      let message = res.message
      if (!isEdit) setMediaFiles([])
      notify(message)
      navigate(`${area}/records/${res.data.record.id}`, { replace: isEdit })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrors(err.errors)
        setFormError(err.message)
        await checkPhone(true)
        partySection.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (err instanceof ApiError && err.isValidation) {
        setErrors(err.errors)
        setFormError(err.message)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setFormError(err instanceof ApiError ? err.message : 'Could not save the record. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (masters.error) return <ErrorState error={masters.error} onRetry={masters.reload} />
  if (existing.error) return <ErrorState error={existing.error} onRetry={existing.reload} />
  if (locations.error) return <ErrorState error={locations.error} onRetry={locations.reload} />
  if (!masters.data || !locations.data || (isEdit && !existing.data)) return <PageLoader />
  if (isEdit && existing.data && !existing.data.can_edit) {
    return <ErrorState error={new ApiError('You do not have permission to edit this record.', 403)} />
  }

  const cancel = () => navigate(isEdit ? `${area}/records/${recordId}` : `${area}/records`)
  const chooseTransaction = (transaction: 'rental' | 'sale' | '') => {
    const type = masters.data?.types.find((t) => t.slug === transaction)
    setForm((f) => ({ ...f, transaction_type: transaction, property_type_id: type ? String(type.id) : '' }))
    clearError('transaction_type')
  }
  const chooseCategory = (category: 'residential' | 'commercial' | '') => {
    const master = masters.data?.categories.find((t) => t.slug === category)
    setForm((f) => ({ ...f, property_category: category, property_category_id: master ? String(master.id) : '' }))
    clearError('property_category')
    clearError('property_category_id')
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PageHeader
        title={isEdit ? `Edit ${existing.data?.record.reference}` : 'New Record'}
        description={isEdit ? existing.data?.record.title : 'Capture a property or business record. Fields marked * are required.'}
        actions={
          <Button variant="primary" icon={<ArrowLeft className="size-4" />} onClick={cancel}>
            Back
          </Button>
        }
      />

      <div className="space-y-6">
        {formError && <Alert tone="error">{formError}</Alert>}
        {locked && (
          <Alert tone="info" title="This record is approved">
            You can update the process stage here. Other property details are locked — contact your Admin if they need to change.
          </Alert>
        )}
        {isUser && approvalStatus === 'pending' && (
          <Alert tone="warning" title="Waiting for approval">
            Your changes are saved to the pending record and shown to your Admin in its history.
          </Alert>
        )}
        {isUser && approvalStatus === 'rejected' && existing.data?.record.approval.rejection_reason && (
          <Alert tone="error" title="Rejected — please correct and resubmit">
            {existing.data.record.approval.rejection_reason}
          </Alert>
        )}

        <Section title="Basic information">
          <div className="sm:col-span-2 lg:col-span-3">
            <TextField label="Property Details" required maxLength={200} placeholder="e.g. 3BHK apartment for rent in Anna Nagar" {...field('title')} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 grid gap-4 sm:grid-cols-2">
            <SelectField label="Property Type" required placeholder="Select type" options={masters.data.types.map((t) => ({ value: t.slug, label: t.name }))} value={form.transaction_type} error={errors.transaction_type} onChange={(e) => chooseTransaction(e.target.value as 'rental' | 'sale' | '')} />
            <SelectField label="Property Category" required placeholder="Select category" options={masters.data.categories.map((t) => ({ value: t.slug, label: t.name }))} value={form.property_category} error={errors.property_category ?? errors.property_category_id} onChange={(e) => chooseCategory(e.target.value as 'residential' | 'commercial' | '')} />
          </div>
        </Section>

        <div ref={partySection}>
          <Card title="Party information" subtitle="Owner, tenant, buyer or contact for this record.">
            {errors.party_id && <div className="mb-4"><Alert tone="error">{errors.party_id}</Alert></div>}
            {selectedParty ? (
              <div className="flex flex-col gap-3 rounded-lg border border-brand-100 bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <UserRoundCheck className="size-5 text-brand-500" />
                  <div>
                    <p className="font-medium text-ink">{selectedParty.name}</p>
                    <p className="text-sm text-muted">{formatPhone(selectedParty.phone)} · linked existing party</p>
                  </div>
                </div>
                {!locked && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedParty(null)
                      setPartyForm(EMPTY_PARTY)
                    }}
                  >
                    Change party
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <TextField label="Party name" required maxLength={150} {...partyField('name')} />
                  <TextField
                    label="Phone"
                    type="tel"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210"
                    hint="Enter exactly 10 digits, without +91 or spaces."
                    {...partyField('phone')}
                    onBlur={() => void checkPhone()}
                  />
                  <TextField label="Alternate phone" type="tel" inputMode="numeric" maxLength={10} {...partyField('alt_phone')} />
                  <TextField label="Email" type="email" maxLength={190} {...partyField('email')} />
                  <div className="sm:col-span-2">
                    <TextField label="Address" maxLength={500} {...partyField('address')} />
                  </div>
                </div>

                {matches && (
                  <div className="rounded-lg border border-warning/30 bg-warning-soft p-4">
                    <p className="text-sm font-medium text-warning">A party with this phone number already exists.</p>
                    <p className="mt-0.5 text-sm text-ink-soft">Link the existing party to avoid duplicates, or create a separate party.</p>
                    <ul className="mt-3 space-y-2">
                      {matches.map((m) => (
                        <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface px-3 py-2">
                          <span className="text-sm">
                            <span className="font-medium text-ink">{m.name}</span> <span className="text-muted">· {formatPhone(m.phone)}</span>
                          </span>
                          <Button size="sm" icon={<UserRoundCheck className="size-4" />} onClick={() => linkParty(m)}>
                            Use this party
                          </Button>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      icon={<UserRoundPlus className="size-4" />}
                      onClick={() => {
                        setConfirmNewParty(true)
                        setMatches(null)
                        clearError('party_phone')
                      }}
                    >
                      Create a new party anyway
                    </Button>
                  </div>
                )}
                {confirmNewParty && <p className="text-xs text-muted">A separate party will be created with this phone number.</p>}
              </div>
            )}
          </Card>
        </div>

        <Section title="Location">
          <div className="sm:col-span-2 lg:col-span-3">
            <TextField
              label="Google Maps link"
              type="url"
              required
              maxLength={1000}
              placeholder="https://maps.google.com/..."
              hint={mapLookupStatus === 'loading'
                ? <span className="inline-flex items-center gap-1.5 text-ink-soft"><LoaderCircle className="size-3.5 animate-spin" />{mapLookupMessage}</span>
                : mapLookupMessage
                  ? <span className={mapLookupStatus === 'error' ? 'text-danger' : 'text-success'}>{mapLookupMessage}</span>
                  : 'Required. Paste a Google Maps link to fill available location fields.'}
              {...field('map_url')}
              onChange={(e) => updateMapUrl(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <TextField label="Property address" maxLength={255} placeholder="Door no., street, landmark" {...field('address_line')} />
          </div>
          <TextField label="Area / locality" maxLength={120} {...field('locality')} />
          <SelectField label="District" placeholder="Select district" options={(locations.data.districts['Tamil Nadu'] ?? []).map((district) => ({ value: district, label: district }))} value={form.district} error={errors.district} onChange={(e) => {
            const selectedDistrict = e.target.value
            setForm((f) => ({ ...f, district: selectedDistrict, state: selectedDistrict ? 'Tamil Nadu' : '' }))
            clearError('district')
          }} />
          <div>
            <TextField label="City" list="record-city-suggestions" maxLength={120} placeholder="Enter city" value={form.city} error={errors.city} onChange={(e) => { setForm((f) => ({ ...f, city: e.target.value })); clearError('city') }} />
            <datalist id="record-city-suggestions">{cities.map((city) => <option key={city} value={city} />)}</datalist>
          </div>
          <TextField label="Pincode" inputMode="numeric" maxLength={6} {...field('pincode')} />
        </Section>

        <Section title="Property details" subtitle={group ? `${group === 'residential' ? 'Residential' : 'Commercial'} details · ${form.transaction_type === 'rental' ? 'Rental' : form.transaction_type === 'sale' ? 'Sale' : 'Select transaction type'}` : 'Select a property category to see relevant fields.'}>
          <div className="grid min-w-0 gap-4 sm:col-span-2 sm:grid-cols-3 lg:col-span-3">
            <TextField label="Area" inputMode="decimal" {...field('area_value')} />
            <SelectField
              label="Unit"
              placeholder={!isNewAreaUnit(form.area_unit) ? 'Keep existing unit' : undefined}
              hint={!isNewAreaUnit(form.area_unit) ? `This record uses the legacy unit ${form.area_unit.replace('_', ' ')}. Select a new unit to change it.` : undefined}
              options={[
                { value: 'sq_ft', label: 'Sq.ft' },
                { value: 'acre', label: 'Acre' },
                { value: 'cent', label: 'Cent' },
              ]}
              value={isNewAreaUnit(form.area_unit) ? form.area_unit : ''}
              onChange={(e) => setForm((current) => ({ ...current, area_unit: (e.target.value || current.area_unit) as StoredAreaUnit }))}
              disabled={locked}
            />
            <TextField label="Dimensions" maxLength={100} placeholder="e.g. 40 x 60 ft" {...field('dimensions')} />
          </div>
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-2">
            <TextField label="Floor details" maxLength={100} placeholder="e.g. 2nd floor of 5" {...field('floor_details')} />
            <SelectField
              label="Property facing"
              placeholder="Not specified"
              options={[
              { value: 'north', label: 'North' },
              { value: 'south', label: 'South' },
              { value: 'east', label: 'East' },
              { value: 'west', label: 'West' },
              { value: 'north_east', label: 'North-East' },
              { value: 'north_west', label: 'North-West' },
              { value: 'south_east', label: 'South-East' },
              { value: 'south_west', label: 'South-West' },
              ]}
              {...field('property_facing')}
            />
          </div>
          {shows('bedrooms') && <TextField label="Bedrooms" inputMode="numeric" {...field('bedrooms')} />}
          {shows('bathrooms') && <TextField label="Bathrooms" inputMode="numeric" {...field('bathrooms')} />}
          {shows('furnishing') && (
            <SelectField
              label="Furnishing"
              placeholder="Not specified"
              options={Object.entries(FURNISHING_LABELS).map(([value, label]) => ({ value, label }))}
              {...field('furnishing')}
            />
          )}
          {shows('commercial_usage') && <TextField label="Commercial usage" maxLength={100} placeholder="Office, shop, warehouse…" {...field('commercial_usage')} />}
          {shows('rental_amount') && (
            <TextField label="Rent amount (₹ / month)" inputMode="decimal" required {...field('rental_amount')} />
          )}
          {shows('security_deposit') && <TextField label="Security deposit (₹)" inputMode="decimal" {...field('security_deposit')} />}
          {shows('sale_amount') && <TextField label="Expected price (₹)" hint="Commas or dots are accepted, e.g. 2,05,00,000." inputMode="decimal" {...field('sale_amount')} />}
          {shows('market_price') && <TextField label="Market price (₹)" hint="Commas or dots are accepted, e.g. 2,05,00,000." inputMode="decimal" {...field('market_price')} />}
        </Section>

        <div ref={mediaSection}>
          <RecordMediaPicker recordId={recordId ?? undefined} media={existing.data?.media ?? []} files={mediaFiles} setFiles={setMediaFiles} disabled={locked || saving} onChanged={() => void existing.reload()} required error={errors.media} />
        </div>

        <Section title="Process details" subtitle="Current business stage of this record.">
          <div className="sm:col-span-2 lg:col-span-3">
          <SelectField
            label="Process stage"
            required
            options={masters.data.stages.map((s) => ({ value: String(s.id), label: s.name }))}
            {...field('process_stage_id')}
          />
          </div>
          {isEdit && !locked && (
            <SelectField
              label="Record status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' },
              ]}
              hint="Archived records are hidden from the default list."
              {...field('record_status')}
            />
          )}
        </Section>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-6">
          {!isUser && !isEdit && <p className="mr-auto text-xs text-muted">Records created by an Admin are approved directly.</p>}
          <Button variant="secondary" onClick={cancel} disabled={saving}>
            Cancel
          </Button>
          {isUser && canSubmitFromForm ? (
            <>
              {/* Draft / rejected: save without sending, or save and (re)submit for Admin approval. */}
              <Button type="submit" variant="secondary" loading={saving} icon={<Save className="size-4" />}>
                {approvalStatus === 'rejected' ? 'Save changes' : 'Save draft'}
              </Button>
              <Button type="submit" loading={saving} icon={<Send className="size-4" />} onClick={() => (submitIntent.current = true)}>
                {approvalStatus === 'rejected' ? 'Save & resubmit' : 'Submit for approval'}
              </Button>
            </>
          ) : (
            <Button type="submit" loading={saving} icon={<Save className="size-4" />}>
              {locked ? 'Save progress' : isEdit ? 'Save changes' : 'Create record'}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
