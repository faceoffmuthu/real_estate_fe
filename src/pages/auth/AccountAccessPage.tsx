import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '../../components/layout/BrandMark'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Field'
import { ApiError, authApi } from '../../services/api'
import { PASSWORD_HINT, rules, validate } from '../../utils/validation'

export function AccountAccessPage({ mode }: { mode: 'forgot' | 'reset' | 'self-forgot' }) {
  const title = mode === 'reset' ? 'Reset Password' : 'Forgot Password'
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || new URLSearchParams(window.location.search).get('token') || '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    document.title = `${title} | N Real Estate`
    if (mode === 'reset') window.history.replaceState(window.history.state, '', window.location.pathname)
  }, [title, mode])
  const set = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }))
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const checks = validate({
      ...(mode === 'forgot' ? { email: [rules.required(form.email, 'Email'), rules.email(form.email), rules.length(form.email, 'Email', 3, 190)] } : {}),
      ...(mode === 'reset' ? {
        password: [rules.required(form.password, 'Password'), rules.password(form.password)],
        password_confirmation: [rules.required(form.password_confirmation, 'Confirmation'), form.password !== form.password_confirmation ? 'Passwords must match.' : null],
      } : {}),
    })
    setErrors(checks)
    if (Object.keys(checks).length) return
    setBusy(true)
    try {
      const response = mode === 'reset' ? await authApi.reset(token, form.password, form.password_confirmation) : mode === 'self-forgot' ? await authApi.forgotSelf() : await authApi.forgot(form.email)
      setSuccess(response.message)
      setForm(f => ({ ...f, password: '', password_confirmation: '' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete your request.')
      if (err instanceof ApiError) setErrors(err.errors)
    } finally { setBusy(false) }
  }
  return <main className={`app-backdrop flex w-full items-center justify-center p-4 sm:p-8 ${mode === 'self-forgot' ? 'min-h-0' : 'min-h-dvh'}`}>
    <div className={`flex w-full flex-col justify-center space-y-7 rounded-xl border border-line bg-surface p-6 shadow-sm sm:p-10 ${mode === 'self-forgot' ? 'min-h-[310px] max-w-[600px] -translate-y-3 sm:min-h-[360px] sm:-translate-y-6' : 'max-w-[520px]'}`}>
      <div className="flex items-center gap-3"><BrandMark /><span className="text-lg font-semibold">N Real Estate</span></div>
      <div><h1 className="text-2xl font-semibold text-ink">{title}</h1><p className="mt-2 text-sm text-muted">{mode === 'forgot' ? 'Enter your registered email address.' : mode === 'self-forgot' ? 'A password reset link will be sent to the email on your signed-in account.' : 'Choose a strong new password for your account.'}</p></div>
      {success ? <Alert tone="success">{success}</Alert> : mode === 'reset' && !/^[a-f0-9]{64}$/.test(token) ? <Alert tone="error">Invalid or missing reset link. <Link className="underline" to="/forgot-password">Request a new link</Link>.</Alert> : <form className="space-y-4" onSubmit={submit} noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        {mode === 'forgot' && <TextField label="Email" type="email" autoComplete="email" required maxLength={190} value={form.email} onChange={e => set('email', e.target.value)} error={errors.email} />}
        {mode === 'reset' && <><TextField label="New Password" type="password" autoComplete="new-password" required value={form.password} onChange={e => set('password', e.target.value)} hint={PASSWORD_HINT} error={errors.password} /><TextField label="Confirm Password" type="password" autoComplete="new-password" required value={form.password_confirmation} onChange={e => set('password_confirmation', e.target.value)} error={errors.password_confirmation} /></>}
        <Button type="submit" className="w-full" loading={busy}>{mode === 'reset' ? 'Reset Password' : 'Send Reset Link'}</Button>
      </form>}
      <p className="text-center text-sm text-muted"><Link className="font-medium text-brand-500 hover:underline" to="/login">Back to Login</Link></p>
    </div>
  </main>
}
