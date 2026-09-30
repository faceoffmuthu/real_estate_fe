export function BrandMark({ className = 'size-9' }: { className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-lg bg-brand-500 ${className}`}>
      <svg viewBox="0 0 24 24" className="size-[55%]" fill="white" aria-hidden="true">
        <path d="M3 11.2 12 3l9 8.2V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1z" />
      </svg>
    </span>
  )
}
