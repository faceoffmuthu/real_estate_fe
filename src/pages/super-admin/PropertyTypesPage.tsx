import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageLoader } from '../../components/ui/Spinner'
import { ErrorState } from '../../components/ui/States'
import { Table, Td, Th } from '../../components/ui/Table'
import { useApi } from '../../hooks/useApi'
import { propertyCategoriesApi, propertyTypesApi } from '../../services/api'

/** Read-only system masters. Record classification is transaction type + category. */
export function PropertyTypesPage() {
  const { data, error, reload } = useApi(async (signal) => {
    const [types, categories] = await Promise.all([propertyTypesApi.list(true, signal), propertyCategoriesApi.list(signal)])
    return { types: types.items, categories: categories.items }
  })

  return <>
    <PageHeader title="Property Types & Categories" description="System classification masters used consistently by Super Admin, Admin and User record forms." />
    {error ? <ErrorState error={error} onRetry={reload} /> : !data ? <PageLoader /> : <div className="grid gap-6 xl:grid-cols-2">
      <Card title="Property Type" subtitle="Transaction type">
        <Table minWidth={400}>
          <thead><tr><Th>Property Type</Th><Th>Existing records</Th></tr></thead>
          <tbody>{data.types.map((item) => <tr key={item.id}><Td className="font-medium">{item.name}</Td><Td>{item.record_count ?? 0}</Td></tr>)}</tbody>
        </Table>
      </Card>
      <Card title="Property Category" subtitle="Property category">
        <Table minWidth={400}>
          <thead><tr><Th>Property Category</Th></tr></thead>
          <tbody>{data.categories.map((item) => <tr key={item.id}><Td className="font-medium">{item.name}</Td></tr>)}</tbody>
        </Table>
      </Card>
    </div>}
  </>
}
