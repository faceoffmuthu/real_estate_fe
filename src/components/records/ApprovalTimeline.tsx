import { CheckCircle2, FilePen, Pencil, Send, ShieldCheck, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { ApprovalAction, ApprovalHistoryEntry } from '../../types'
import { ROLE_LABELS, formatDateTime } from '../../utils/format'
import { APPROVAL_ACTION_LABELS } from '../../utils/records'
import { EmptyState } from '../ui/States'

const icons: Record<ApprovalAction, { icon: ReactNode; tone: string }> = {
  created_draft: { icon: <FilePen className="size-4" />, tone: 'bg-surface-3 text-ink-soft' },
  created_approved: { icon: <ShieldCheck className="size-4" />, tone: 'bg-success-soft text-success' },
  submitted: { icon: <Send className="size-4" />, tone: 'bg-brand-50 text-brand-500' },
  resubmitted: { icon: <Send className="size-4" />, tone: 'bg-brand-50 text-brand-500' },
  edited: { icon: <Pencil className="size-4" />, tone: 'bg-surface-3 text-ink-soft' },
  approved: { icon: <CheckCircle2 className="size-4" />, tone: 'bg-success-soft text-success' },
  rejected: { icon: <XCircle className="size-4" />, tone: 'bg-danger-soft text-danger' },
}

/**
 * Approval history of a record (oldest first), or recent approval activity
 * across records when `showRecord` is set.
 */
export function ApprovalTimeline({
  items,
  showRecord = false,
  recordLink,
}: {
  items: ApprovalHistoryEntry[]
  showRecord?: boolean
  recordLink?: (id: number) => string
}) {
  if (items.length === 0) {
    return <EmptyState title="No approval activity yet" description="Submissions, approvals and rejections will appear here." />
  }
  return (
    <ol className="relative space-y-5">
      {items.map((h, i) => {
        const { icon, tone } = icons[h.action] ?? icons.edited
        return (
          <li key={h.id} className="relative flex gap-3">
            {i < items.length - 1 && <span className="absolute top-9 bottom-[-1.25rem] left-4 w-px bg-line" aria-hidden="true" />}
            <span className={`relative grid size-8 shrink-0 place-items-center rounded-full ${tone}`}>{icon}</span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-ink">
                {APPROVAL_ACTION_LABELS[h.action] ?? h.action}
                {showRecord && (
                  <>
                    {' · '}
                    {recordLink ? (
                      <Link to={recordLink(h.record.id)} className="text-brand-500 hover:underline">
                        {h.record.reference}
                      </Link>
                    ) : (
                      h.record.reference
                    )}
                  </>
                )}
              </p>
              <p className="text-xs text-muted">
                {h.performed_by ? `${h.performed_by.name} (${ROLE_LABELS[h.performed_by.role] ?? h.performed_by.role})` : 'System'} ·{' '}
                <time dateTime={h.created_at}>{formatDateTime(h.created_at)}</time>
              </p>
              {h.reason && (
                <p className="mt-2 rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-ink-soft">
                  <span className="font-medium text-danger">Reason: </span>
                  {h.reason}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
