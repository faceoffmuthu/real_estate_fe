import { CheckCircle2, Clock, FilePen, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ApprovalStatus, RecordStatus, RecordSummary } from '../../types'
import { APPROVAL_LABELS } from '../../utils/records'
import { Badge, type BadgeTone } from '../ui/Badge'

/** Business / process stage (not the approval status). */
export function StageBadge({ stage }: { stage: RecordSummary['process_stage'] }) {
  const tone = stage.slug === 'completed' ? 'green' : stage.slug === 'closed' ? 'neutral' : stage.slug === 'new' ? 'blue' : 'brand'
  return <Badge tone={tone}>{stage.name}</Badge>
}

export function RecordStatusBadge({ status }: { status: RecordStatus }) {
  return status === 'archived' ? <Badge tone="amber">Archived</Badge> : null
}

const approvalStyle: Record<ApprovalStatus, { tone: BadgeTone; icon: ReactNode }> = {
  draft: { tone: 'neutral', icon: <FilePen className="size-3" /> },
  pending: { tone: 'amber', icon: <Clock className="size-3" /> },
  approved: { tone: 'green', icon: <CheckCircle2 className="size-3" /> },
  rejected: { tone: 'red', icon: <XCircle className="size-3" /> },
}

/** Approval workflow status — icon + text label (never colour alone). */
export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const { tone, icon } = approvalStyle[status]
  return (
    <Badge tone={tone}>
      {icon}
      {APPROVAL_LABELS[status]}
    </Badge>
  )
}
