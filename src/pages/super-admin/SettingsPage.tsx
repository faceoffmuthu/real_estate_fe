import { useEffect, useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { ChangePasswordCard } from '../../components/account/ChangePasswordCard'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { TextField } from '../../components/ui/Field'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageLoader } from '../../components/ui/Spinner'
import { ErrorState } from '../../components/ui/States'
import { useToast } from '../../components/ui/Toast'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'
import { ApiError, settingsApi } from '../../services/api'
import { formatDateTime } from '../../utils/format'
import { rules, type FieldErrors } from '../../utils/validation'

export function SettingsPage() {
  const notify = useToast()
  const { refresh } = useAuth()
  const { data, error, loading, reload } = useApi((signal) => settingsApi.list(signal))
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) setValues(Object.fromEntries(data.items.map((s) => [s.key, s.value ?? ''])))
  }, [data])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!data) return
    setFormError(null)
    const clientErrors: FieldErrors = {}
    for (const s of data.items) {
      const v = values[s.key] ?? ''
      const err =
        (s.key === 'company_name' ? rules.required(v, s.label) : null) ||
        (s.type === 'email' ? rules.email(v) : s.type === 'phone' ? rules.phone(v) : null)
      if (err) clientErrors[s.key] = err
    }
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length) return

    setSaving(true)
    try {
      const res = await settingsApi.update(values)
      notify(res.message)
      reload()
      void refresh() // company name is shown in the layout
    } catch (err) {
      if (err instanceof ApiError && err.isValidation) setErrors(err.errors)
      setFormError(err instanceof ApiError ? err.message : 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Settings" description="System-level configuration and your account security." />
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3" title="System settings" subtitle="Only the Super Admin can change these values.">
          {loading && !data ? (
            <PageLoader />
          ) : error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : data ? (
            <form onSubmit={submit} noValidate className="space-y-5">
              {formError && <Alert tone="error">{formError}</Alert>}
              {data.items.map((s) => (
                <TextField
                  key={s.key}
                  label={s.label}
                  type={s.type === 'email' ? 'email' : s.type === 'phone' ? 'tel' : 'text'}
                  required={s.key === 'company_name'}
                  value={values[s.key] ?? ''}
                  onChange={(e) => {
                    setValues((v) => ({ ...v, [s.key]: e.target.value }))
                    setErrors((er) => ({ ...er, [s.key]: '' }))
                  }}
                  error={errors[s.key]}
                  hint={`${s.description ?? ''}${s.updated_by ? ` Last changed by ${s.updated_by}, ${formatDateTime(s.updated_at)}.` : ''}`}
                  maxLength={500}
                />
              ))}
              <div className="flex justify-end">
                <Button type="submit" loading={saving} icon={<Save className="size-4" />}>
                  Save settings
                </Button>
              </div>
            </form>
          ) : null}
        </Card>
        <div className="xl:col-span-2">
          <ChangePasswordCard />
        </div>
      </div>
    </>
  )
}
