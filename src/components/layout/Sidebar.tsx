import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import type { Role } from '../../types'
import { useNotifications } from '../../context/NotificationsContext'
import { NAV_BY_ROLE } from '../../routes/navigation'
import { BrandMark } from './BrandMark'

interface SidebarProps {
  role: Role
  companyName: string
  open: boolean
  onClose: () => void
}

export function Sidebar({ role, companyName, open, onClose }: SidebarProps) {
  const { pendingApprovals } = useNotifications()
  return (
    <>
      {/* Mobile / tablet backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-black/30 transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center gap-3 border-b border-line px-5">
          <BrandMark />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{companyName}</p>
            <p className="text-[11px] tracking-wide text-muted uppercase">CRM</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:text-ink lg:hidden" aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {NAV_BY_ROLE[role].map(({ label, to, icon: Icon, phase, badge }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-500 text-white'
                        : 'text-ink-soft hover:bg-brand-50 hover:text-brand-500'
                    }`
                  }
                >
                  <Icon className="size-[18px] shrink-0" />
                  <span className="flex-1">{label}</span>
                  {phase && <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] text-muted">Soon</span>}
                  {badge === 'pendingApprovals' && !!pendingApprovals && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-warning px-1.5 text-[11px] font-semibold text-white" aria-label={`${pendingApprovals} pending`}>
                      {pendingApprovals}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-line p-4 text-[11px] text-muted">N Real Estate · Phase 4</div>
      </aside>
    </>
  )
}
