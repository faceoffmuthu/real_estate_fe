import type { ReactNode } from 'react'
import type { AccountStatus, Role } from '../../types'
import { ROLE_LABELS } from '../../utils/format'

export type BadgeTone = 'neutral' | 'brand' | 'solid' | 'green' | 'amber' | 'red' | 'blue'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-3 text-ink-soft border-line',
  brand: 'bg-brand-50 text-brand-500 border-brand-100',
  solid: 'bg-brand-500 text-white border-brand-500',
  green: 'bg-success-soft text-success border-success/20',
  amber: 'bg-warning-soft text-warning border-warning/20',
  red: 'bg-danger-soft text-danger border-danger/20',
  blue: 'bg-info-soft text-info border-info/20',
}

export function Badge({ tone = 'neutral', children, dot = false }: { tone?: BadgeTone; children: ReactNode; dot?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${tones[tone]}`}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: AccountStatus }) {
  return (
    <Badge tone={status === 'active' ? 'green' : 'neutral'} dot>
      {status === 'active' ? 'Active' : 'Inactive'}
    </Badge>
  )
}

const roleTones: Record<Role, BadgeTone> = { super_admin: 'solid', admin: 'brand', user: 'neutral' }

export function RoleBadge({ role }: { role: Role }) {
  return <Badge tone={roleTones[role]}>{ROLE_LABELS[role]}</Badge>
}
