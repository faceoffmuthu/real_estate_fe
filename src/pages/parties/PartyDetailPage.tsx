import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { PartyFormModal } from '../../components/records/PartyFormModal'
import { PhoneActions } from '../../components/records/PhoneActions'
import { StageBadge } from '../../components/records/RecordBadges'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageLoader } from '../../components/ui/Spinner'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { Table, Td, Th } from '../../components/ui/Table'
import { useApi } from '../../hooks/useApi'
import { useArea } from '../../hooks/useArea'
import { ApiError, partiesApi } from '../../services/api'
import { formatDate, formatDateTime } from '../../utils/format'
import { locationLabel } from '../../utils/records'

export function PartyDetailPage() {
  const { id } = useParams()
  const area = useArea()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const partyId = Number(id)
  const { data, error, loading, reload } = useApi(
    (signal) => (Number.isInteger(partyId) && partyId > 0 ? partiesApi.view(partyId, signal) : Promise.reject(new ApiError('Party not found.', 404))),
    [partyId],
  )

  if (loading && !data) return <PageLoader />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data) return null
  const { party, records } = data

  return (
    <>
      <PageHeader
        title={party.name}
        description="Party details and linked records."
        actions={
          <>
            <Button variant="primary" icon={<ArrowLeft className="size-4" />} onClick={() => navigate(`${area}/parties`)}>
              All parties
            </Button>
            {party.can_edit && (
              <Button icon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>
                Edit party
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Contact details">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs font-medium tracking-wide text-muted uppercase">Phone</dt>
              <dd className="mt-1">
                <PhoneActions phone={party.phone} label={party.name} />
              </dd>
            </div>
            {party.alt_phone && (
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted uppercase">Alternate phone</dt>
                <dd className="mt-1">
                  <PhoneActions phone={party.alt_phone} label={party.name} />
                </dd>
              </div>
            )}
            {(
              [
                ['Email', party.email ? <a key="email" className="text-brand-500 hover:underline" href={`mailto:${encodeURIComponent(party.email)}`}>{party.email} · Email</a> : null],
                ['Address', party.address],
                ['Added by', party.created_by?.name],
                ['Added', formatDateTime(party.created_at)],
                ['Last updated', formatDateTime(party.updated_at)],
              ] as Array<[string, string | null | undefined]>
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
                <dd className="mt-1 break-words text-ink">{value || '—'}</dd>
              </div>
            ))}
          </dl>
          {party.notes && <p className="mt-5 border-t border-line pt-4 text-sm whitespace-pre-line text-ink-soft">{party.notes}</p>}
        </Card>

        <Card title={`Linked records (${records.length})`} className="xl:col-span-2" bodyClassName="pt-4 pb-2">
          {records.length === 0 ? (
            <EmptyState title="No linked records in your scope" />
          ) : (
            <Table minWidth={640}>
              <thead>
                <tr>
                  <Th>Reference</Th>
                  <Th>Classification</Th>
                  <Th>Location</Th>
                  <Th>Stage</Th>
                  <Th>Created</Th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-brand-50/40">
                    <Td>
                      <Link to={`${area}/records/${r.id}`} className="font-semibold text-brand-500 hover:underline">
                        {r.reference}
                      </Link>
                      <p className="max-w-56 truncate text-xs text-muted">{r.title}</p>
                    </Td>
                    <Td>{r.transaction_type ? (r.transaction_type === 'rental' ? 'Rental' : 'Sale') : 'Unclassified'}{r.property_category ? ` · ${r.property_category === 'residential' ? 'Residential' : 'Commercial'}` : ''}</Td>
                    <Td>{locationLabel(r)}</Td>
                    <Td>
                      <StageBadge stage={r.process_stage} />
                    </Td>
                    <Td className="whitespace-nowrap">{formatDate(r.created_at)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      {party.can_edit && <PartyFormModal party={party} open={editing} onClose={() => setEditing(false)} onSaved={reload} />}
    </>
  )
}
