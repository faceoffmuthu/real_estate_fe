import { useEffect, useState, type FormEvent } from 'react'
import { ApiError, partiesApi } from '../../services/api'
import type { Party, PartyPayload } from '../../types'
import { formatPhone } from '../../utils/records'
import { rules, validate, type FieldErrors } from '../../utils/validation'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { TextAreaField, TextField } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/Toast'

type Form = Required<PartyPayload>

const toForm = (p: Party): Form => ({
  name: p.name,
  phone: formatPhone(p.phone),
  alt_phone: p.alt_phone ? formatPhone(p.alt_phone) : '',
  email: p.email ?? '',
  address: p.address ?? '',
  notes: p.notes ?? '',
})

export function PartyFormModal({ party, open, onClose, onSaved }: { party: Party; open: boolean; onClose: () => void; onSaved: () => void }) {
  const notify = useToast()
  const [form, setForm] = useState<Form>(() => toForm(party))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(toForm(party))
      setErrors({})
      setFormError(null)
    }
  }, [open, party])

  const field = (key: keyof Form) => ({
    value: form[key],
    error: errors[key],
    onChange: (e: { target: { value: string } }) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
      setErrors((er) => ({ ...er, [key]: '' }))
    },
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const clientErrors = validate({
      name: [rules.required(form.name, 'Party name'), rules.length(form.name, 'Party name', 2, 150)],
      phone: [rules.required(form.phone, 'Phone'), rules.partyPhone(form.phone)],
      alt_phone: [rules.partyPhone(form.alt_phone)],
      email: [rules.email(form.email)],
    })
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      return
    }
    setSaving(true)
    try {
      const res = await partiesApi.update(party.id, form)
      notify(res.message)
      onSaved()
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.isValidation) setErrors(err.errors)
      setFormError(err instanceof ApiError ? err.message : 'Could not save the party.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Edit party"
      description="Changes apply to every record linked to this party."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="party-form" loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="party-form" onSubmit={submit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Party name" required maxLength={150} {...field('name')} />
          <TextField label="Phone" type="tel" required maxLength={25} {...field('phone')} />
          <TextField label="Alternate phone" type="tel" maxLength={25} {...field('alt_phone')} />
          <TextField label="Email" type="email" maxLength={190} {...field('email')} />
        </div>
        <TextField label="Address" maxLength={500} {...field('address')} />
        <TextAreaField label="Notes" maxLength={2000} {...field('notes')} />
      </form>
    </Modal>
  )
}
