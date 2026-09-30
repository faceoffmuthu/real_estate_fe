import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Contact } from 'lucide-react'
import { PhoneActions } from '../../components/records/PhoneActions'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { SearchInput } from '../../components/ui/SearchInput'
import { PageLoader } from '../../components/ui/Spinner'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { Table, Td, Th } from '../../components/ui/Table'
import { useApi } from '../../hooks/useApi'
import { useArea } from '../../hooks/useArea'
import { useDebounce } from '../../hooks/useDebounce'
import { partiesApi } from '../../services/api'
import { formatDate } from '../../utils/format'

/** Parties visible to the caller (scope decided by the backend). Parties are created from the record form. */
export function PartiesPage() {
  const area = useArea()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)
  const { data, error, loading, reload } = useApi((signal) => partiesApi.list({ search: debouncedSearch, page, per_page: 20 }, signal), [debouncedSearch, page])

  return (
    <>
      <PageHeader title="Parties" description="Owners, tenants, buyers and other contacts linked to your records." />
      <div className="card-shadow rounded-xl border border-line bg-surface p-5">
        <div className="border-b border-line p-4">
          <SearchInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by name, phone or email"
            aria-label="Search parties"
          />
        </div>
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data ? (
          <PageLoader />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={<Contact className="size-5" />}
            title={search ? 'No parties match your search' : 'No parties yet'}
            description={search ? 'Try a different name or phone number.' : 'Parties are added when you create a record.'}
          />
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : ''}>
            <Table minWidth={820}>
              <thead>
                <tr>
                  <Th>Party</Th>
                  <Th>Phone</Th>
                  <Th>Email</Th>
                  <Th>Records</Th>
                  <Th>Added by</Th>
                  <Th>Added</Th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-50/40">
                    <Td>
                      <Link to={`${area}/parties/${p.id}`} className="font-medium text-ink hover:text-brand-500 hover:underline">
                        {p.name}
                      </Link>
                    </Td>
                    <Td>
                      <PhoneActions phone={p.phone} label={p.name} />
                    </Td>
                    <Td className="max-w-56 truncate">{p.email ?? '—'}</Td>
                    <Td className="tabular-nums">{p.record_count}</Td>
                    <Td className="whitespace-nowrap">{p.created_by?.name ?? '—'}</Td>
                    <Td className="whitespace-nowrap">{formatDate(p.created_at)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination data={data.pagination} onPage={setPage} />
          </div>
        )}
      </div>
    </>
  )
}
