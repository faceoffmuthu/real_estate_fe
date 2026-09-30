import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useNotifications } from '../../context/NotificationsContext'
import { ApiError, approvalsApi } from '../../services/api'
import type { RecordDetail, RecordSummary } from '../../types'
import { formatDateTime } from '../../utils/format'
import { locationLabel } from '../../utils/records'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { TextAreaField } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/Toast'

type Target = Pick<RecordSummary, 'id' | 'reference' | 'title' | 'party' | 'property_type' | 'transaction_type' | 'property_category' | 'locality' | 'city' | 'created_by' | 'approval'>

function Summary({ record }: { record: Target }) {
  return (
    <dl className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-surface-2 p-4 text-sm">
      {[
        ['Record', `${record.reference} — ${record.title}`],
        ['Party', record.party.name],
        ['Property', `${record.transaction_type ?? 'Unclassified'}${record.property_category ? ` · ${record.property_category}` : ''}`],
        ['Location', locationLabel(record)],
        ['Submitted by', record.created_by.name],
        ['Submitted', formatDateTime(record.approval.submitted_at)],
      ].map(([label, value]) => (
        <div key={label} className={label === 'Record' ? 'col-span-2' : ''}>
          <dt className="text-xs text-muted">{label}</dt>
          <dd className="font-medium break-words text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

interface DialogProps {
  record: Target | null
  onClose: () => void
  onDone: (record: RecordDetail) => void
}

/** Confirmation step before approving (no single-click approvals). */
export function ApproveDialog({ record, onClose, onDone }: DialogProps) {
  const notify = useToast()
  const { refresh } = useNotifications()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => setError(null), [record])

  const confirm = async () => {
    if (!record) return
    setBusy(true)
    setError(null)
    try {
      const res = await approvalsApi.approve(record.id)
      notify(`${record.reference}: ${res.message}`)
      refresh()
      onDone(res.data.record)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not approve the record.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={!!record}
      onClose={onClose}
      title="Approve this record?"
      description="The record becomes approved and the submitting user is notified."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="success" onClick={confirm} loading={busy} icon={<CheckCircle2 className="size-4" />}>
            Approve record
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        {record && <Summary record={record} />}
      </div>
    </Modal>
  )
}

/** Rejection requires a reason, which the user sees on their record. */
export function RejectDialog({ record, onClose, onDone }: DialogProps) {
  const notify = useToast()
  const { refresh } = useNotifications()
  const [reason, setReason] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    setReason('')
    setFieldError(undefined)
    setError(null)
  }, [record])

  const confirm = async () => {
    if (!record) return
    const trimmed = reason.trim()
    if (trimmed.length < 5) {
      setFieldError(trimmed ? 'Rejection reason must be at least 5 characters.' : 'Rejection reason is required.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await approvalsApi.reject(record.id, trimmed)
      notify(`${record.reference}: ${res.message}`)
      refresh()
      onDone(res.data.record)
    } catch (err) {
      if (err instanceof ApiError && err.isValidation) setFieldError(err.errors.reason)
      setError(err instanceof ApiError ? err.message : 'Could not reject the record.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={!!record}
      onClose={onClose}
      title="Reject record"
      description="Explain what needs to be corrected. The user can edit and resubmit."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm} loading={busy} icon={<XCircle className="size-4" />}>
            Reject record
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        {record && <Summary record={record} />}
        <TextAreaField
          label="Reason"
          required
          rows={4}
          maxLength={1000}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value)
            setFieldError(undefined)
          }}
          error={fieldError}
          placeholder="e.g. Phone number needs verification"
        />
      </div>
    </Modal>
  )
}
