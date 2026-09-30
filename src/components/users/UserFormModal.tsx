import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { ApiError, usersApi } from '../../services/api'
import type { AccountStatus, Role, User, UserPayload } from '../../types'
import { ROLE_LABELS } from '../../utils/format'
import { PASSWORD_HINT, rules, validate, type FieldErrors } from '../../utils/validation'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { SelectField, TextField } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/Toast'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (user: User) => void
  /** Account being edited; omit to create. */
  user?: User | null
  /** Role for new accounts (Super Admin chooses per page; Admin always creates Users). */
  defaultRole: Exclude<Role, 'super_admin'>
  /** Active admins for the "Assigned admin" select (Super Admin only). */
  admins?: Array<{ id: number; name: string }>
}

interface FormState {
  name: string
  username: string
  email: string
  phone: string
  password: string
  role: Exclude<Role, 'super_admin'>
  manager_id: string
  status: AccountStatus
}

function initialState(user: User | null | undefined, defaultRole: FormState['role']): FormState {
  return {
    name: user?.name ?? '',
    username: user?.username ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    password: '',
    role: (user?.role as FormState['role']) ?? defaultRole,
    manager_id: user?.manager ? String(user.manager.id) : '',
    status: user?.status ?? 'active',
  }
}

export function UserFormModal({ open, onClose, onSaved, user, defaultRole, admins = [] }: Props) {
  const { user: actor } = useAuth()
  const notify = useToast()
  const isEdit = !!user
  const isSuperAdmin = actor?.role === 'super_admin'
  const [form, setForm] = useState<FormState>(() => initialState(user, defaultRole))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(initialState(user, defaultRole))
      setErrors({})
      setFormError(null)
    }
  }, [open, user, defaultRole])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => {
      const next = { ...e }
      delete next[key]
      return next
    })
  }

  const needsManager = isSuperAdmin && form.role === 'user'
  // Required when creating a User or converting an Admin into a User.
  const requireManager = needsManager && (!isEdit || user!.role !== 'user')
  const managerOptions = admins.filter((a) => a.id !== user?.id).map((a) => ({ value: String(a.id), label: a.name }))
  if (user?.manager && !managerOptions.some((o) => o.value === String(user.manager!.id))) {
    managerOptions.unshift({ value: String(user.manager.id), label: `${user.manager.name ?? 'Unknown'} (inactive)` })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const clientErrors = validate({
      name: [rules.required(form.name, 'Name'), rules.length(form.name, 'Name', 2, 120)],
      username: [rules.required(form.username, 'Username'), rules.username(form.username)],
      email: [rules.required(form.email, 'Email'), rules.email(form.email)],
      phone: [isSuperAdmin ? rules.required(form.phone, 'Phone') : null, rules.phone(form.phone)],
      password: [isEdit ? null : rules.required(form.password, 'Password'), rules.password(form.password)],
      manager_id: [requireManager ? rules.required(form.manager_id, 'Assigned admin') : null],
    })
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      return
    }

    const payload: UserPayload = {
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      status: form.status,
    }
    if (form.password) payload.password = form.password
    if (isSuperAdmin) {
      payload.role = form.role
      if (form.role === 'user' && form.manager_id) payload.manager_id = Number(form.manager_id)
    }

    setSaving(true)
    try {
      const res = isEdit ? await usersApi.update(user!.id, payload) : await usersApi.create(payload)
      notify(res.message)
      onSaved(res.data.user)
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.isValidation) {
        setErrors(err.errors)
        setFormError(err.message)
      } else {
        setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const entity = ROLE_LABELS[form.role]

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? `Edit ${ROLE_LABELS[user!.role]}` : `New ${entity}`}
      description={isEdit ? user!.email : `Create a new ${entity.toLowerCase()} account.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" loading={saving}>
            {isEdit ? 'Save changes' : `Create ${entity}`}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && <Alert tone="error">{formError}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Full name" required value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} maxLength={120} autoComplete="off" />
          <TextField label="Username" required value={form.username} onChange={(e) => set('username', e.target.value)} error={errors.username} maxLength={50} autoComplete="off" />
          <TextField label="Email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} maxLength={190} autoComplete="off" />
          <TextField label="Phone" type="tel" required={isSuperAdmin} value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} maxLength={20} placeholder="+91 98765 43210" />
        </div>

        {isSuperAdmin && (isEdit || needsManager) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {isEdit && <SelectField
              label="Role"
              required
              value={form.role}
              onChange={(e) => set('role', e.target.value as FormState['role'])}
              error={errors.role}
              options={[{ value: user!.role, label: ROLE_LABELS[user!.role] }]}
            />}
            {needsManager && (
              <SelectField
                label="Assigned admin"
                required={requireManager}
                value={form.manager_id}
                onChange={(e) => set('manager_id', e.target.value)}
                error={errors.manager_id}
                placeholder="Select an admin"
                options={managerOptions}
                hint={managerOptions.length === 0 ? 'Create an active Admin first.' : undefined}
              />
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={isEdit ? 'Reset password' : 'Password'}
            type="password"
            required={!isEdit}
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            error={errors.password}
            hint={isEdit ? `Leave blank to keep the current password. ${PASSWORD_HINT}` : PASSWORD_HINT}
            autoComplete="new-password"
            maxLength={72}
          />
          <SelectField
            label="Status"
            value={form.status}
            onChange={(e) => set('status', e.target.value as AccountStatus)}
            error={errors.status}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>
      </form>
    </Modal>
  )
}
