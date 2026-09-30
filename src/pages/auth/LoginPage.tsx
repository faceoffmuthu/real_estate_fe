import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Building2, LockKeyhole, ShieldCheck, UserRound, Users } from 'lucide-react'
import { BrandMark } from '../../components/layout/BrandMark'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Field'
import { useAuth } from '../../hooks/useAuth'
import { HOME_BY_ROLE } from '../../routes/navigation'
import { ApiError } from '../../services/api'
import { rules, validate, type FieldErrors } from '../../utils/validation'

export function LoginPage() {
  const { login, sessionExpired } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ login: '', password: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (key: 'login' | 'password', value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const clientErrors = validate({
      login: [rules.required(form.login, 'Email or username')],
      password: [rules.required(form.password, 'Password')],
    })
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      return
    }

    setSubmitting(true)
    try {
      const user = await login(form.login.trim(), form.password)
      // Return to the originally requested page only if it belongs to this role's area.
      const from = (location.state as { from?: string } | null)?.from
      const home = HOME_BY_ROLE[user.role]
      const area = home.split('/')[1]
      navigate(from && from.startsWith(`/${area}/`) ? from : home, { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.isValidation) setErrors(err.errors)
      else setFormError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.')
      setForm((f) => ({ ...f, password: '' }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app-backdrop flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-xl border border-line bg-surface shadow-xl shadow-black/5 lg:grid-cols-[1.1fr_1fr]">
        {/* Brand panel */}
        <div className="hidden flex-col justify-between bg-brand-700 p-10 text-white lg:flex">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-white">
              <svg viewBox="0 0 24 24" className="size-5 fill-brand-500" aria-hidden="true">
                <path d="M3 11.2 12 3l9 8.2V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1z" />
              </svg>
            </span>
            <div>
              <p className="font-semibold">N Real Estate</p>
              <p className="text-xs text-white/70">Customer Relationship Management</p>
            </div>
          </div>

          <div>
            <h1 className="text-3xl leading-tight font-semibold tracking-tight">Every property, party and deal — in one organised place.</h1>
            <p className="mt-4 max-w-md text-sm text-white/75">
              Move your real-estate business out of scattered chats into a structured, role-based workspace.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-white/85">
              {[
                { icon: ShieldCheck, text: 'Role-based access for Super Admin, Admin and User' },
                { icon: Building2, text: 'Rental, residential and commercial records' },
                { icon: Users, text: 'Parties with one-tap WhatsApp and call' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-md bg-white/10">
                    <Icon className="size-4" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/60">© {new Date().getFullYear()} N Real Estate. All rights reserved.</p>
        </div>

        {/* Form panel */}
        <div className="flex flex-col justify-center p-6 sm:p-10">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark />
            <p className="font-semibold text-ink">N Real Estate</p>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-ink">Welcome back</h2>
          <p className="mt-1 text-sm text-muted">Sign in with your email or username to continue.</p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            {sessionExpired && !formError && <Alert tone="warning">Your session has expired. Please sign in again.</Alert>}
            {formError && <Alert tone="error">{formError}</Alert>}

            <TextField
              label="Email or username"
              value={form.login}
              onChange={(e) => set('login', e.target.value)}
              error={errors.login}
              autoComplete="username"
              autoFocus
              icon={<UserRound className="size-4" />}
              maxLength={190}
            />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              error={errors.password}
              autoComplete="current-password"
              icon={<LockKeyhole className="size-4" />}
            />

            <Button type="submit" loading={submitting} className="w-full">
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <div className="mt-5 flex justify-end text-sm text-brand-500"><Link to="/forgot-password" className="hover:underline">Forgot Password?</Link></div>

          <p className="mt-8 text-center text-xs text-muted">
            N Real Estate · Your property business, organised.
          </p>
        </div>
      </div>
    </div>
  )
}
