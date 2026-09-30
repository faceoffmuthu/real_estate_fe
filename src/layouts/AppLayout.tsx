import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, KeyRound, LogOut, Menu, Settings, UserRound } from 'lucide-react'
import { NotificationBell } from '../components/layout/NotificationBell'
import { Sidebar } from '../components/layout/Sidebar'
import { Avatar } from '../components/ui/Avatar'
import { RoleBadge } from '../components/ui/Badge'
import { useToast } from '../components/ui/Toast'
import { NotificationsProvider } from '../context/NotificationsContext'
import { useAuth } from '../hooks/useAuth'
import { NAV_BY_ROLE } from '../routes/navigation'

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, settings, logout } = useAuth()
  const notify = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  if (!user) return null

  const current = NAV_BY_ROLE[user.role].find((item) => location.pathname.startsWith(item.to))
  const companyName = settings.company_name || 'N Real Estate'

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      notify('You have been logged out.')
    } catch {
      // Session is cleared client-side even if the request failed.
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <NotificationsProvider>
    <div className="app-backdrop min-h-screen">
      <Sidebar role={user.role} companyName={companyName} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-ink-soft hover:bg-surface-3 hover:text-ink lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <p className="min-w-0 flex-1 truncate text-sm text-muted">
            <span className="hidden sm:inline">{companyName} / </span>
            <span className="text-ink">{current?.label ?? 'Overview'}</span>
          </p>

          <NotificationBell />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-3 rounded-lg py-1.5 pr-2 pl-1.5 hover:bg-surface-3"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <Avatar name={user.name} size="sm" />
              <span className="hidden text-left sm:block">
                <span className="block max-w-40 truncate text-sm font-medium text-ink">{user.name}</span>
                <span className="block text-xs text-muted">{user.role_name}</span>
              </span>
              <ChevronDown className="size-4 text-muted" />
            </button>

            {menuOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-64 rounded-lg border border-line bg-surface p-2 shadow-lg">
                <div className="border-b border-line px-3 pt-2 pb-3">
                  <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                  <div className="mt-2">
                    <RoleBadge role={user.role} />
                  </div>
                </div>
                <button role="menuitem" onClick={() => { setMenuOpen(false); navigate('/profile') }} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-surface-3 hover:text-ink">
                  <UserRound className="size-4" /> My Profile
                </button>
                <button role="menuitem" onClick={() => { setMenuOpen(false); navigate(user.role === 'super_admin' ? '/super-admin/settings' : '/settings') }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-surface-3 hover:text-ink">
                  <Settings className="size-4" /> Settings
                </button>
                <button role="menuitem" onClick={() => { setMenuOpen(false); navigate('/account-recovery') }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-surface-3 hover:text-ink">
                  <KeyRound className="size-4" /> Forgot Password
                </button>
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-surface-3 hover:text-danger disabled:opacity-60"
                >
                  <LogOut className="size-4" />
                  {loggingOut ? 'Signing out…' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
    </NotificationsProvider>
  )
}
