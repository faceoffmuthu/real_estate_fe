import { Link } from 'react-router-dom'
import { Compass, Construction, ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { HOME_BY_ROLE } from '../../routes/navigation'

function StatusLayout({ icon, code, title, message }: { icon: ReactNode; code?: string; title: string; message: string }) {
  const { user } = useAuth()
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-500">{icon}</span>
      {code && <p className="mt-6 text-sm font-medium text-brand-500">{code}</p>}
      <h1 className="mt-2 text-2xl font-semibold text-ink">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-muted">{message}</p>
      <Link
        to={user ? HOME_BY_ROLE[user.role] : '/login'}
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-700"
      >
        {user ? 'Back to dashboard' : 'Go to login'}
      </Link>
    </div>
  )
}

export function ForbiddenPage() {
  return (
    <StatusLayout
      icon={<ShieldAlert className="size-7" />}
      code="403 · Forbidden"
      title="You don't have access to this page"
      message="This area is restricted to a different role. If you think this is a mistake, contact your administrator."
    />
  )
}

export function NotFoundPage() {
  return (
    <div className="min-h-screen">
      <StatusLayout
        icon={<Compass className="size-7" />}
        code="404 · Not found"
        title="Page not found"
        message="The page you are looking for doesn't exist or has been moved."
      />
    </div>
  )
}

export function ComingSoonPage({ title, phase, description }: { title: string; phase: number; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-surface">
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-500">
          <Construction className="size-6" />
        </span>
        <p className="mt-5 text-xs font-medium tracking-wider text-brand-500 uppercase">Planned for Phase {phase}</p>
        <h1 className="mt-2 text-xl font-semibold text-ink">{title}</h1>
        <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
      </div>
    </div>
  )
}
