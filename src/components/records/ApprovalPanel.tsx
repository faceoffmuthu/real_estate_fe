import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Pencil, Send, XCircle } from 'lucide-react'
import { useNotifications } from '../../context/NotificationsContext'
import { useArea } from '../../hooks/useArea'
import { ApiError, recordsApi } from '../../services/api'
import type { RecordDetail } from '../../types'
import { formatDateTime } from '../../utils/format'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useToast } from '../ui/Toast'
import { ApprovalBadge } from './RecordBadges'
import { ApproveDialog, RejectDialog } from './ReviewDialogs'

interface Props {
  record: RecordDetail
  canReview: boolean
  canSubmit: boolean
  editMode: 'all' | 'progress' | 'none'
  onChanged: () => void
}

/** Approval status, review metadata and the workflow actions available to the viewer. */
export function ApprovalPanel({ record, canReview, canSubmit, editMode, onChanged }: Props) {
  const a = record.approval
  const area = useArea()
  const navigate = useNavigate()
  const notify = useToast()
  const { refresh } = useNotifications()
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    try {
      const res = await recordsApi.submit(record.id)
      notify(res.message)
      refresh()
      onChanged()
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not submit the record.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const done = () => {
    setApproving(false)
    setRejecting(false)
    onChanged()
  }

  const border = { draft: 'border-line', pending: 'border-warning/40', approved: 'border-success/30', rejected: 'border-danger/40' }[a.status]

  return (
    <Card title="Approval" className={`border-2 ${border}`}>
      <div className="flex flex-wrap items-center gap-2">
        <ApprovalBadge status={a.status} />
        {a.status === 'draft' && <span className="text-sm text-muted">Not yet submitted — only you can see this record.</span>}
        {a.status === 'pending' && <span className="text-sm text-muted">Waiting for Admin review.</span>}
      </div>

      {a.status === 'rejected' && a.rejection_reason && (
        <div className="mt-4 rounded-lg border border-danger/20 bg-danger-soft p-3 text-sm" role="alert">
          <p className="font-medium text-danger">Rejection reason</p>
          <p className="mt-1 whitespace-pre-line text-ink-soft">{a.rejection_reason}</p>
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted">Submitted</dt>
          <dd className="text-ink">{formatDateTime(a.submitted_at)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{a.status === 'rejected' ? 'Rejected by' : 'Reviewed by'}</dt>
          <dd className="text-ink">{a.reviewed_by?.name ?? '—'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-muted">Reviewed</dt>
          <dd className="text-ink">{formatDateTime(a.reviewed_at)}</dd>
        </div>
      </dl>

      {editMode === 'progress' && (
        <p className="mt-4 text-xs text-muted">This record is approved. You can still update its process stage and notes.</p>
      )}

      {canReview && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
          <Button variant="danger" icon={<XCircle className="size-4" />} onClick={() => setRejecting(true)}>
            Reject
          </Button>
          <Button variant="success" icon={<CheckCircle2 className="size-4" />} onClick={() => setApproving(true)} className="ml-auto">
            Approve
          </Button>
        </div>
      )}

      {canSubmit && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
          {a.status === 'rejected' && (
            <Button variant="secondary" icon={<Pencil className="size-4" />} onClick={() => navigate(`${area}/records/${record.id}/edit`)}>
              Correct & resubmit
            </Button>
          )}
          <Button icon={<Send className="size-4" />} loading={submitting} onClick={submit} className="ml-auto">
            {a.status === 'rejected' ? 'Resubmit as is' : 'Submit for approval'}
          </Button>
        </div>
      )}

      <ApproveDialog record={approving ? record : null} onClose={() => setApproving(false)} onDone={done} />
      <RejectDialog record={rejecting ? record : null} onClose={() => setRejecting(false)} onDone={done} />
    </Card>
  )
}
