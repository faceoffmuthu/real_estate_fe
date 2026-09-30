import type { Role } from '../types'

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  user: 'User',
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

export function formatDate(iso: string | null | undefined) {
  return iso ? dateFormatter.format(new Date(iso)) : '—'
}

export function formatDateTime(iso: string | null | undefined) {
  return iso ? dateTimeFormatter.format(new Date(iso)) : '—'
}

export function timeAgo(iso: string | null | undefined) {
  if (!iso) return 'Never'
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 45) return 'just now'
  if (abs < 3600) return relativeFormatter.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return relativeFormatter.format(Math.round(seconds / 3600), 'hour')
  if (abs < 86400 * 30) return relativeFormatter.format(Math.round(seconds / 86400), 'day')
  return formatDate(iso)
}

/** 'auth.login_failed' → 'Login failed' */
export function actionLabel(action: string) {
  const known: Record<string, string> = {
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.login_failed': 'Failed login',
    'auth.login_blocked': 'Blocked login',
    'auth.password_changed': 'Password changed',
    'access.denied': 'Access denied',
    'user.created': 'Account created',
    'user.updated': 'Account updated',
    'user.activated': 'Account activated',
    'user.deactivated': 'Account deactivated',
    'user.role_changed': 'Role changed',
    'user.reassigned': 'Account reassigned',
    'user.password_reset': 'Password reset',
    'settings.updated': 'Settings updated',
    'record.created': 'Record created',
    'record.updated': 'Record updated',
    'record.stage_changed': 'Stage changed',
    'record.submitted': 'Record submitted',
    'record.resubmitted': 'Record resubmitted',
    'record.approved': 'Record approved',
    'record.rejected': 'Record rejected',
    'record.review_opened': 'Review opened',
    'record.archived': 'Record archived',
    'record.restored': 'Record restored',
    'party.created': 'Party created',
    'party.updated': 'Party updated',
    'property_type.created': 'Property type created',
    'property_type.updated': 'Property type updated',
  }
  if (known[action]) return known[action]
  const tail = action.split('.').pop() ?? action
  return tail.charAt(0).toUpperCase() + tail.slice(1).replace(/_/g, ' ')
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value)
}
