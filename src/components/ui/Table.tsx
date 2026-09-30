import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'

export function Table({ children, minWidth = 720, spacing = 'default' }: { children: ReactNode; minWidth?: number; spacing?: 'default' | 'comfortable' }) {
  return (
    <div className={`${spacing === 'comfortable' ? 'my-6' : 'my-4'} overflow-x-auto rounded-xl border border-line bg-surface shadow-sm`}>
      <table className="crm-table w-full border-separate border-spacing-0 text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  )
}

export function Th({ children, className = '', ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`border-b border-brand-600 bg-brand-500 px-5 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-white uppercase ${className}`}
      {...rest}
    >
      {children}
    </th>
  )
}

export function Td({ children, className = '', ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`border-b border-line/60 px-5 py-3.5 align-middle text-ink-soft ${className}`} {...rest}>
      {children}
    </td>
  )
}
