import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { CRMPanel, RecordFollowUps, RecordTimeline } from '../../components/records/CRMPanel'
import { PhoneActions } from '../../components/records/PhoneActions'
import { ApprovalPanel } from '../../components/records/ApprovalPanel'
import { ApprovalTimeline } from '../../components/records/ApprovalTimeline'
import { ApprovalBadge, RecordStatusBadge, StageBadge } from '../../components/records/RecordBadges'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageLoader } from '../../components/ui/Spinner'
import { ErrorState } from '../../components/ui/States'
import { useApi } from '../../hooks/useApi'
import { useArea } from '../../hooks/useArea'
import { ApiError, recordsApi } from '../../services/api'
import { ROLE_LABELS, formatDateTime } from '../../utils/format'
import { FURNISHING_LABELS, PROPERTY_FACING_LABELS, formatCurrency, formatEnteredArea } from '../../utils/records'

type Item = [label: string, value: ReactNode]

/** Label/value grid; empty values are shown as "—". */
function Details({ items, columns = 3 }: { items: Item[]; columns?: 2 | 3 }) {
  return (
    <dl className={`grid gap-x-6 gap-y-4 sm:grid-cols-2 ${columns === 3 ? 'lg:grid-cols-3' : ''}`}>
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
          <dd className="mt-1 text-sm break-words text-ink">{value === null || value === undefined || value === '' ? '—' : value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function RecordDetailPage() {
  const { id } = useParams()
  const area = useArea()
  const navigate = useNavigate()
  const recordId = Number(id)
  const [crmRevision, setCrmRevision] = useState(0)
  const { data, error, loading, reload } = useApi(
    (signal) => (Number.isInteger(recordId) && recordId > 0 ? recordsApi.view(recordId, signal) : Promise.reject(new ApiError('Record not found.', 404))),
    [recordId],
  )

  const crmChanged = () => {setCrmRevision(v => v + 1); reload()}

  if (loading && !data) return <PageLoader />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data) return null
  const { record: r, party, can_edit, edit_mode, can_review, can_submit, approval_history } = data
  const shows = (field: string) => (r.property_category === 'residential' && ['bedrooms', 'bathrooms', 'furnishing'].includes(field)) || (r.property_category === 'commercial' && ['commercial_usage', 'furnishing'].includes(field)) || (r.transaction_type === 'rental' && ['rental_amount', 'security_deposit'].includes(field)) || (r.transaction_type === 'sale' && ['sale_amount', 'market_price'].includes(field))

  const typeItems: Item[] = [
    ['Area', formatEnteredArea(r.area_value, r.area_unit)],
    ['Dimensions', r.dimensions],
    ['Floor details', r.floor_details],
    ['Property facing', r.property_facing ? PROPERTY_FACING_LABELS[r.property_facing] : null],
  ]
  if (shows('bedrooms')) typeItems.push(['Bedrooms', r.bedrooms])
  if (shows('bathrooms')) typeItems.push(['Bathrooms', r.bathrooms])
  if (shows('furnishing')) typeItems.push(['Furnishing', r.furnishing ? FURNISHING_LABELS[r.furnishing] : null])
  if (shows('commercial_usage')) typeItems.push(['Commercial usage', r.commercial_usage])
  if (shows('rental_amount')) typeItems.push(['Rent (per month)', r.rental_amount != null ? formatCurrency(r.rental_amount) : null])
  if (shows('security_deposit')) typeItems.push(['Security deposit', r.security_deposit != null ? formatCurrency(r.security_deposit) : null])
  if (shows('sale_amount')) typeItems.push(['Expected price', r.sale_amount != null ? formatCurrency(r.sale_amount) : null])
  if (shows('market_price')) typeItems.push(['Market price', r.market_price != null ? formatCurrency(r.market_price) : null])

  return (
    <>
      <PageHeader
        title={r.reference}
        description={r.title}
        actions={
          <>
            <Button variant="primary" icon={<ArrowLeft className="size-4" />} onClick={() => navigate(`${area}/records`)}>
              All records
            </Button>
            {can_edit && (
              <Button icon={<Pencil className="size-4" />} onClick={() => navigate(`${area}/records/${r.id}/edit`)}>
                {edit_mode === 'progress' ? 'Update progress' : 'Edit record'}
              </Button>
            )}
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge tone="brand">{r.transaction_type ? r.transaction_type[0].toUpperCase() + r.transaction_type.slice(1) : 'Unclassified transaction'}</Badge>
        {r.property_category && <Badge>{r.property_category[0].toUpperCase() + r.property_category.slice(1)}</Badge>}
        <StageBadge stage={r.process_stage} />
        <ApprovalBadge status={r.approval.status} />
        <RecordStatusBadge status={r.record_status} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 space-y-6 xl:col-span-2">
          <Card title="Basic details">
            <Details
              items={[
                ['Reference', <span key="ref" className="font-semibold">{r.reference}</span>],
                ['Transaction Type', r.transaction_type ? (r.transaction_type === 'rental' ? 'Rental' : 'Sale') : null],
                ['Property Category', r.property_category ? (r.property_category === 'residential' ? 'Residential' : 'Commercial') : null],
              ]}
            />
            {r.description && <p className="mt-5 border-t border-line pt-4 text-sm whitespace-pre-line text-ink-soft">{r.description}</p>}
          </Card>

          <Card title="Property details">
            <Details items={typeItems} />
          </Card>

          {(data.media?.length ?? 0) > 0 && <Card title="Property media" subtitle={`${data.media.length} file${data.media.length === 1 ? '' : 's'}`}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {data.media.map(item => item.media_type === 'image'
                ? <img key={item.id} className="max-h-[28rem] w-full rounded-lg border border-line bg-canvas object-contain" src={recordsApi.mediaUrl(item.id)} alt={`Property ${r.reference}`} loading="lazy" />
                : <video key={item.id} className="max-h-[28rem] w-full rounded-lg bg-black" src={recordsApi.mediaUrl(item.id)} controls preload="metadata" />)}
            </div>
          </Card>}

          <Card title="Location">
            <Details
              items={[
                ['Address', r.address_line],
                ['Area / locality', r.locality],
                ['City', r.city],
                ['District', r.district],
                ['State', r.state],
                ['Pincode', r.pincode],
                ['Location Map', r.map_url ? <a key="map" href={r.map_url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-500 hover:underline">Open map</a> : null],
              ]}
            />
          </Card>

          <CRMPanel key={`${r.updated_at}-${r.contact_status}-${r.last_contacted_at}`} record={r} people={data.crm_assignees} canManage={data.can_manage_crm} onChanged={crmChanged} />
          <RecordFollowUps recordId={r.id} people={data.crm_assignees} canManage={data.can_manage_crm} onChanged={crmChanged} />
          <RecordTimeline revision={crmRevision} recordId={r.id} canManage={data.can_manage_crm} onChanged={reload} />
          <Card title="Process details">
            <Details items={[['Current stage', <StageBadge key="stage" stage={r.process_stage} />], ['Record status', r.record_status === 'active' ? 'Active' : 'Archived']]} />
            {r.process_notes && <p className="mt-5 border-t border-line pt-4 text-sm whitespace-pre-line text-ink-soft">{r.process_notes}</p>}
          </Card>
        </div>

        {/* On narrow screens approval + party come first (review workflow). */}
        <div className="order-first min-w-0 space-y-6 xl:order-none">
          <ApprovalPanel record={r} canReview={can_review} canSubmit={can_submit} editMode={edit_mode} onChanged={reload} />

          <Card
            title="Party details"
            action={
              <Link to={`${area}/parties/${party.id}`} className="text-xs font-medium text-brand-500 hover:underline">
                View party
              </Link>
            }
          >
            <p className="text-lg font-semibold text-ink">{party.name}</p>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted uppercase">Phone</p>
                <div className="mt-1">
                  <PhoneActions phone={party.phone} label={party.name} />
                </div>
              </div>
              {party.alt_phone && (
                <div>
                  <p className="text-xs font-medium tracking-wide text-muted uppercase">Alternate phone</p>
                  <div className="mt-1">
                    <PhoneActions phone={party.alt_phone} label={party.name} />
                  </div>
                </div>
              )}
              <Details columns={2} items={[['Email', party.email ? <a key="email" className="text-brand-500 hover:underline" href={`mailto:${encodeURIComponent(party.email)}`}>{party.email} · Email</a> : null], ['Address', party.address]]} />
              {party.notes && <p className="border-t border-line pt-3 whitespace-pre-line text-ink-soft">{party.notes}</p>}
            </div>
          </Card>

          <Card title="Record information">
            <Details
              columns={2}
              items={[
                ['Created by', `${r.created_by.name} (${ROLE_LABELS[r.created_by.role]})`],
                ['Created', formatDateTime(r.created_at)],
                ['Submitted', formatDateTime(r.approval.submitted_at)],
                ['Reviewed', r.approval.reviewed_by ? `${r.approval.reviewed_by.name}, ${formatDateTime(r.approval.reviewed_at)}` : null],
                ['Last updated by', r.updated_by?.name],
                ['Last updated', formatDateTime(r.updated_at)],
              ]}
            />
          </Card>

          <Card title="Approval history">
            <ApprovalTimeline items={approval_history} />
          </Card>
        </div>
      </div>
    </>
  )
}
