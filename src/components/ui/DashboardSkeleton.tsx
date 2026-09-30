/** Lightweight dashboard loading placeholder without mock metric values. */
export function DashboardSkeleton() {
  return <div aria-label="Loading dashboard" aria-busy="true" className="space-y-6">
    <div className="h-8 w-56 animate-pulse rounded bg-surface-3" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => <div key={i} className="card-shadow rounded-xl border border-line bg-surface p-5">
        <div className="flex justify-between"><div className="h-4 w-28 animate-pulse rounded bg-surface-3" /><div className="size-10 animate-pulse rounded-xl bg-brand-50" /></div>
        <div className="mt-5 h-8 w-20 animate-pulse rounded bg-surface-3" />
        <div className="mt-4 h-1.5 w-full animate-pulse rounded bg-surface-3" />
      </div>)}
    </div>
    <div className="h-56 animate-pulse rounded-xl border border-line bg-surface" />
  </div>
}
