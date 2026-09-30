import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'

/** Search box used in list-page filter bars. */
export function SearchInput({ className = '', ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return (
    <div className={`relative flex-1 ${className}`}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        maxLength={100}
        className="form-control h-11 w-full rounded-lg border border-line-strong bg-surface pr-3 pl-9 text-sm text-ink placeholder:text-muted/70 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 focus:outline-none"
        {...rest}
      />
    </div>
  )
}
