import { useState, type FormEvent } from 'react'
import { KeyRound } from 'lucide-react'
import { ApiError, authApi } from '../../services/api'
import { PASSWORD_HINT, rules, validate, type FieldErrors } from '../../utils/validation'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { TextField } from '../ui/Field'
import { useToast } from '../ui/Toast'

const empty = { current_password: '', new_password: '', confirm_password: '' }

export function ChangePasswordCard() {
  const notify = useToast()
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = (key: keyof typeof empty, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const clientErrors = validate({
      current_password: [rules.required(form.current_password, 'Current password')],
      new_password: [rules.required(form.new_password, 'New password'), rules.password(form.new_password)],
      confirm_password: [
        rules.required(form.confirm_password, 'Password confirmation'),
        form.confirm_password && form.confirm_password !== form.new_password ? 'Passwords do not match.' : null,
      ],
    })
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      return
    }
    setSaving(true)
    try {
      const res = await authApi.changePassword(form)
      notify(res.message)
      setForm(empty)
      setErrors({})
    } catch (err) {
      if (err instanceof ApiError && err.isValidation) setErrors(err.errors)
      else setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="Change password" subtitle="Changing your password signs out your other sessions.">
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}
        <TextField label="Current password" type="password" value={form.current_password} onChange={(e) => set('current_password', e.target.value)} error={errors.current_password} autoComplete="current-password" />
        <TextField label="New password" type="password" value={form.new_password} onChange={(e) => set('new_password', e.target.value)} error={errors.new_password} hint={PASSWORD_HINT} autoComplete="new-password" maxLength={72} />
        <TextField label="Confirm new password" type="password" value={form.confirm_password} onChange={(e) => set('confirm_password', e.target.value)} error={errors.confirm_password} autoComplete="new-password" maxLength={72} />
        <div className="flex justify-end">
          <Button type="submit" loading={saving} icon={<KeyRound className="size-4" />}>
            Update password
          </Button>
        </div>
      </form>
    </Card>
  )
}
