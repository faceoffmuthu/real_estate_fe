import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PageLoader } from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'
import { AppLayout } from '../layouts/AppLayout'
import { ForbiddenPage } from '../pages/shared/StatusPages'
import type { Role } from '../types'
import { HOME_BY_ROLE } from './navigation'

/**
 * Client-side route guard. This only controls what is rendered — every API
 * the page calls is independently authorised by the PHP backend.
 */
export function ProtectedRoute({ roles }: { roles: Role[] }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <PageLoader label="Checking your session…" />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  return <AppLayout>{roles.includes(user.role) ? <Outlet /> : <ForbiddenPage />}</AppLayout>
}

/** Login page: already-authenticated users go straight to their dashboard. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  if (status === 'loading') return <PageLoader label="Checking your session…" />
  if (user) return <Navigate to={HOME_BY_ROLE[user.role]} replace />
  return <>{children}</>
}

/** `/` and unknown top-level paths resolve to the role's dashboard. */
export function HomeRedirect() {
  const { status, user } = useAuth()
  if (status === 'loading') return <PageLoader label="Checking your session…" />
  return <Navigate to={user ? HOME_BY_ROLE[user.role] : '/login'} replace />
}
