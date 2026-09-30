import {
  Activity,
  BarChart3,
  Building2,
  CalendarClock,
  ClipboardCheck,
  Contact,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '../types'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Future phase that delivers this module; the page shows a placeholder until then. */
  phase?: number
  /** Live counter shown next to the item. */
  badge?: 'pendingApprovals'
}

/** URL prefix of each role's area. */
export const AREA_BY_ROLE: Record<Role, string> = {
  super_admin: '/super-admin',
  admin: '/admin',
  user: '/user',
}

export const HOME_BY_ROLE: Record<Role, string> = {
  super_admin: '/super-admin/dashboard',
  admin: '/admin/dashboard',
  user: '/user/dashboard',
}

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  super_admin: [
    { label: 'Dashboard', to: '/super-admin/dashboard', icon: LayoutDashboard },
    { label: 'Records', to: '/super-admin/records', icon: Building2 },
    { label: 'Follow-ups', to: '/super-admin/follow-ups', icon: CalendarClock },
    { label: 'Parties', to: '/super-admin/parties', icon: Contact },
    { label: 'Approvals', to: '/super-admin/approvals', icon: ClipboardCheck },
    { label: 'Property Types', to: '/super-admin/property-types', icon: Tags },
    { label: 'Admins', to: '/super-admin/admins', icon: ShieldCheck },
    { label: 'Users', to: '/super-admin/users', icon: Users },
    { label: 'Activity', to: '/super-admin/activity', icon: Activity },
    { label: 'Reports', to: '/reports', icon: BarChart3 },
    { label: 'Settings', to: '/super-admin/settings', icon: Settings },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Records', to: '/admin/records', icon: Building2 },
    { label: 'Follow-ups', to: '/admin/follow-ups', icon: CalendarClock },
    { label: 'Pending Approvals', to: '/admin/approvals', icon: ClipboardCheck, badge: 'pendingApprovals' },
    { label: 'Parties', to: '/admin/parties', icon: Contact },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Activity', to: '/admin/activity', icon: Activity },
    { label: 'Reports', to: '/reports', icon: BarChart3 },
    { label: 'Settings', to: '/settings', icon: Settings },
  ],
  user: [
    { label: 'Dashboard', to: '/user/dashboard', icon: LayoutDashboard },
    { label: 'My Records', to: '/user/records', icon: Building2 },
    { label: 'Follow-ups', to: '/user/follow-ups', icon: CalendarClock },
    { label: 'Parties', to: '/user/parties', icon: Contact },
    { label: 'My Activity', to: '/user/activity', icon: Activity },
    { label: 'Reports', to: '/reports', icon: BarChart3 },
    { label: 'Settings', to: '/settings', icon: Settings },
  ],
}
