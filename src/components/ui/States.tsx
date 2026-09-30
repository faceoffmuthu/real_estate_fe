import type { ReactNode } from 'react'
import { Inbox, RefreshCw, SearchX, ShieldAlert, WifiOff } from 'lucide-react'
import type { ApiError } from '../../services/api'
import { Button } from './Button'

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-surface-3 text-muted">{icon ?? <Inbox className="size-5" />}</span>
      <p className="mt-4 font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Friendly rendering of an ApiError (network, forbidden, server …) with retry. */
export function ErrorState({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  const notFound = error.status === 404
  const icon = error.status === 0 ? <WifiOff className="size-5" /> : error.isForbidden ? <ShieldAlert className="size-5" /> : notFound ? <SearchX className="size-5" /> : undefined
  const title = error.status === 0 ? 'Connection problem' : error.isForbidden ? 'Access denied' : notFound ? 'Not found' : 'Could not load data'
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={error.message}
      action={
        onRetry && !error.isForbidden && !notFound ? (
          <Button variant="secondary" size="sm" onClick={onRetry} icon={<RefreshCw className="size-4" />}>
            Try again
          </Button>
        ) : undefined
      }
    />
  )
}
