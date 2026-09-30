import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Pagination as PaginationData } from '../../types'
import { Button } from './Button'

export function Pagination({ data, onPage }: { data: PaginationData; onPage: (page: number) => void }) {
  const from = data.total === 0 ? 0 : (data.page - 1) * data.per_page + 1
  const to = Math.min(data.page * data.per_page, data.total)

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-1 py-4 sm:px-5 text-sm text-muted sm:flex-row">
      <p>
        Showing <span className="text-ink-soft">{from}</span>–<span className="text-ink-soft">{to}</span> of{' '}
        <span className="text-ink-soft">{data.total}</span>
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={data.page <= 1}
          onClick={() => onPage(data.page - 1)}
          icon={<ChevronLeft className="size-4" />}
        >
          Previous
        </Button>
        <span className="px-1 tabular-nums">
          {data.page} / {data.total_pages}
        </span>
        <Button variant="secondary" size="sm" disabled={data.page >= data.total_pages} onClick={() => onPage(data.page + 1)}>
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
