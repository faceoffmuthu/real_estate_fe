import {
  Activity,
  CheckCircle2,
  Eye,
  Send,
  XCircle,
  Archive,
  Building2,
  Contact,
  GitCommitHorizontal,
  Tags,
  KeyRound,
  LogIn,
  LogOut,
  Settings,
  ShieldAlert,
  ShieldX,
  UserCog,
  UserPlus,
  UserRoundCheck,
  UserRoundX,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { ActivityEntry } from '../../types'
import { actionLabel, timeAgo, formatDateTime } from '../../utils/format'
import { EmptyState } from '../ui/States'

const icons: Record<string, { icon: ReactNode; tone: string }> = {
  'auth.login': { icon: <LogIn className="size-4" />, tone: 'bg-success-soft text-success' },
  'auth.logout': { icon: <LogOut className="size-4" />, tone: 'bg-surface-3 text-ink-soft' },
  'auth.login_failed': { icon: <ShieldX className="size-4" />, tone: 'bg-danger-soft text-danger' },
  'auth.login_blocked': { icon: <ShieldX className="size-4" />, tone: 'bg-danger-soft text-danger' },
  'access.denied': { icon: <ShieldAlert className="size-4" />, tone: 'bg-warning-soft text-warning' },
  'auth.password_changed': { icon: <KeyRound className="size-4" />, tone: 'bg-brand-50 text-brand-500' },
  'user.password_reset': { icon: <KeyRound className="size-4" />, tone: 'bg-brand-50 text-brand-500' },
  'user.created': { icon: <UserPlus className="size-4" />, tone: 'bg-info-soft text-info' },
  'user.activated': { icon: <UserRoundCheck className="size-4" />, tone: 'bg-success-soft text-success' },
  'user.deactivated': { icon: <UserRoundX className="size-4" />, tone: 'bg-warning-soft text-warning' },
  'settings.updated': { icon: <Settings className="size-4" />, tone: 'bg-brand-50 text-brand-700' },
  'record.created': { icon: <Building2 className="size-4" />, tone: 'bg-brand-50 text-brand-500' },
  'record.updated': { icon: <Building2 className="size-4" />, tone: 'bg-surface-3 text-ink-soft' },
  'record.submitted': { icon: <Send className="size-4" />, tone: 'bg-brand-50 text-brand-500' },
  'record.resubmitted': { icon: <Send className="size-4" />, tone: 'bg-brand-50 text-brand-500' },
  'record.approved': { icon: <CheckCircle2 className="size-4" />, tone: 'bg-success-soft text-success' },
  'record.rejected': { icon: <XCircle className="size-4" />, tone: 'bg-danger-soft text-danger' },
  'record.review_opened': { icon: <Eye className="size-4" />, tone: 'bg-surface-3 text-ink-soft' },
  'record.stage_changed': { icon: <GitCommitHorizontal className="size-4" />, tone: 'bg-info-soft text-info' },
  'record.archived': { icon: <Archive className="size-4" />, tone: 'bg-warning-soft text-warning' },
  'record.restored': { icon: <Archive className="size-4" />, tone: 'bg-success-soft text-success' },
  'party.created': { icon: <Contact className="size-4" />, tone: 'bg-brand-50 text-brand-500' },
  'party.updated': { icon: <Contact className="size-4" />, tone: 'bg-surface-3 text-ink-soft' },
  'property_type.created': { icon: <Tags className="size-4" />, tone: 'bg-brand-50 text-brand-700' },
  'property_type.updated': { icon: <Tags className="size-4" />, tone: 'bg-surface-3 text-ink-soft' },
}
const fallback = { icon: <UserCog className="size-4" />, tone: 'bg-brand-50 text-brand-500' }

export function activityIcon(action: string) {
  return icons[action] ?? (action.startsWith('user.') ? fallback : { icon: <Activity className="size-4" />, tone: 'bg-surface-3 text-ink-soft' })
}

/** Compact timeline used on dashboards and detail views. */
export function ActivityFeed({ items, showUser = true }: { items: ActivityEntry[]; showUser?: boolean }) {
  if (items.length === 0) {
    return <EmptyState title="No activity yet" description="Events such as logins and account changes will appear here." />
  }
  return (
    <ul className="divide-y divide-line/60">
      {items.map((item) => {
        const { icon, tone } = activityIcon(item.action)
        return (
          <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${tone}`}>{icon}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink">
                <span className="font-medium">{actionLabel(item.action)}</span>
                {showUser && item.user && <span className="text-muted"> · {item.user.name}</span>}
              </p>
              <p className="truncate text-xs text-muted" title={item.description}>
                {item.description}
              </p>
            </div>
            <time className="shrink-0 text-xs text-muted" dateTime={item.created_at} title={formatDateTime(item.created_at)}>
              {timeAgo(item.created_at)}
            </time>
          </li>
        )
      })}
    </ul>
  )
}
