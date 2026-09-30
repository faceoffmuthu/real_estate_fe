import { initials } from '../../utils/format'

const backgrounds = ['bg-brand-500', 'bg-brand-700', 'bg-chart-2', 'bg-chart-4']

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const background = backgrounds[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % backgrounds.length]
  const sizes = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-16 text-xl' }
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${background} ${sizes[size]}`}
      aria-hidden="true"
    >
      {initials(name) || '?'}
    </span>
  )
}
