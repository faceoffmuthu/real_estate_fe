import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type InputHTMLAttributes, type KeyboardEvent, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, Search, X } from 'lucide-react'

const control =
  'form-control min-w-0 w-full rounded-lg border bg-surface px-3 text-sm text-ink placeholder:text-muted/70 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60'
const controlState = (error?: string) =>
  error
    ? 'border-danger/60 focus:border-danger focus:ring-danger/15'
    : 'border-line-strong focus:border-brand-500 focus:ring-brand-500/15'

interface WrapperProps {
  id: string
  label: string
  error?: string
  hint?: ReactNode
  required?: boolean
  children: ReactNode
}

function FieldWrapper({ id, label, error, hint, required, children }: WrapperProps) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink-soft">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  )
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  error?: string
  hint?: ReactNode
  icon?: ReactNode
}

export function TextField({ label, error, hint, icon, required, type = 'text', className = '', ...rest }: TextFieldProps) {
  const id = useId()
  const [reveal, setReveal] = useState(false)
  const isPassword = type === 'password'

  if (type === 'date') {
    return <DatePickerField id={id} label={label} error={error} hint={hint} required={required} className={className} {...rest} />
  }

  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint} required={required}>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">{icon}</span>}
        <input
          id={id}
          required={required}
          type={isPassword && reveal ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${control} ${controlState(error)} h-11 ${icon ? 'pl-10' : ''} ${isPassword ? 'pr-10' : ''} ${className}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted hover:text-ink"
            aria-label={reveal ? 'Hide password' : 'Show password'}
          >
            {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </FieldWrapper>
  )
}

type DatePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type' | 'onChange'> & {
  id: string
  label: string
  error?: string
  hint?: ReactNode
  required?: boolean
  onChange?: TextFieldProps['onChange']
}

function parseDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

function dateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function DatePickerField({ id, label, error, hint, required, className = '', value = '', onChange, name, form, min, max, disabled, ...rest }: DatePickerProps) {
  const root = useRef<HTMLDivElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const selected = parseDate(String(value))
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => {
    const initial = selected ?? new Date()
    return new Date(initial.getFullYear(), initial.getMonth(), 1)
  })
  const [style, setStyle] = useState<CSSProperties | null>(null)
  const title = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const firstWeekday = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const days = Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - firstWeekday + 1
    return day > 0 && day <= daysInMonth ? new Date(month.getFullYear(), month.getMonth(), day) : null
  })
  const minimum = parseDate(String(min ?? ''))
  const maximum = parseDate(String(max ?? ''))

  useEffect(() => {
    if (!open) return
    const position = () => {
      const rect = root.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(Math.max(rect.width, 288), window.innerWidth - 16)
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
      const below = window.innerHeight - rect.bottom
      const above = rect.top
      const up = below < 340 && above > below
      setStyle({ position: 'fixed', left, width, zIndex: 70, ...(up ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }) })
    }
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node
      if (!root.current?.contains(target) && !popup.current?.contains(target)) setOpen(false)
    }
    position()
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('scroll', position, true)
    window.addEventListener('resize', position)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('scroll', position, true)
      window.removeEventListener('resize', position)
    }
  }, [open])

  const choose = (date: Date) => {
    onChange?.({ target: { value: dateValue(date) } } as ChangeEvent<HTMLInputElement>)
    setOpen(false)
  }
  const openPicker = () => {
    if (selected) setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1))
    setOpen((current) => !current)
  }
  const moveMonth = (amount: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1))
  const today = dateValue(new Date())

  return <FieldWrapper id={id} label={label} error={error} hint={hint} required={required}>
    <div ref={root} className="relative min-w-0">
      {name && <input type="hidden" name={name} form={form} value={String(value ?? '')} disabled={disabled} />}
      <button id={id} type="button" disabled={disabled} aria-label={String(rest['aria-label'] ?? (selected ? `${label}: ${selected.toLocaleDateString()}` : `Choose ${label.toLowerCase()}`))} aria-expanded={open} aria-haspopup="dialog" aria-invalid={!!error} onClick={openPicker} className={`${control} ${controlState(error)} flex h-11 w-full items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60 ${className}`}>
        <span className={selected ? 'text-ink' : 'text-muted'}>{selected ? selected.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}</span>
        <CalendarDays className="size-4 shrink-0 text-brand-500" />
      </button>
      {open && createPortal(<div ref={popup} style={style ?? { position: 'fixed', zIndex: 70, visibility: 'hidden' }} role="dialog" aria-label={`${label} date picker`} onKeyDown={(event) => { if (event.key === 'Escape') { setOpen(false); requestAnimationFrame(() => root.current?.querySelector('button')?.focus()) } }} className="max-h-[min(26rem,calc(100dvh-1rem))] overflow-y-auto rounded-xl border border-line bg-white p-3 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-2">
          <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month" className="grid size-9 place-items-center rounded-lg text-ink-soft transition hover:bg-brand-50 hover:text-brand-600"><ChevronLeft className="size-4" /></button>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <button type="button" onClick={() => moveMonth(1)} aria-label="Next month" className="grid size-9 place-items-center rounded-lg text-ink-soft transition hover:bg-brand-50 hover:text-brand-600"><ChevronRight className="size-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((weekday) => <span key={weekday} className="py-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{weekday}</span>)}
          {days.map((date, index) => {
            if (!date) return <span key={`empty-${index}`} />
            const value = dateValue(date)
            const isSelected = value === String(valueOf(selected))
            const isToday = value === today
            const unavailable = (!!minimum && date < minimum) || (!!maximum && date > maximum)
            return <button key={value} type="button" disabled={unavailable} aria-pressed={isSelected} aria-label={date.toLocaleDateString()} onClick={() => choose(date)} className={`grid aspect-square min-h-9 place-items-center rounded-lg text-sm transition ${isSelected ? 'bg-brand-500 font-semibold text-white shadow-sm' : isToday ? 'border border-brand-200 font-semibold text-brand-600' : 'text-ink hover:bg-brand-50 hover:text-brand-700'} disabled:cursor-not-allowed disabled:opacity-30`}>
              {date.getDate()}
            </button>
          })}
        </div>
        <div className="mt-3 flex justify-between border-t border-line pt-2">
          <button type="button" onClick={() => { onChange?.({ target: { value: '' } } as ChangeEvent<HTMLInputElement>); setOpen(false) }} className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-ink">Clear</button>
          <button type="button" onClick={() => choose(new Date())} className="rounded-md px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50">Today</button>
        </div>
      </div>, document.body)}
    </div>
  </FieldWrapper>
}

function valueOf(date: Date | null) {
  return date ? dateValue(date) : ''
}

type SearchChange = (event: { target: { value: string } }) => void

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'value' | 'onChange' | 'multiple' | 'size'> {
  label: string
  error?: string
  hint?: ReactNode
  options: Array<{ value: string; label: string }>
  placeholder?: string
  searchPlaceholder?: string
  loading?: boolean
  emptyMessage?: string
  allowCustom?: boolean
  onSearchChange?: (query: string) => void
  wrapperClassName?: string
  value?: string | number
  onChange?: SearchChange
}

export function SelectField({ label, error, hint, options, placeholder, required, className = '', wrapperClassName = '', searchPlaceholder, loading, emptyMessage, allowCustom, onSearchChange, ...rest }: SelectFieldProps) {
  const id = useId()
  return (
    <div className={wrapperClassName}>
    <FieldWrapper id={id} label={label} error={error} hint={hint} required={required}>
      <SearchableSelect id={id} options={options} placeholder={placeholder} required={required} error={error} className={`h-11 ${className}`} searchPlaceholder={searchPlaceholder} loading={loading} emptyMessage={emptyMessage} allowCustom={allowCustom} onSearchChange={onSearchChange} {...rest} />
    </FieldWrapper>
    </div>
  )
}

type SearchOption = { value: string; label: string }
type SearchableSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange' | 'multiple' | 'size'> & {
  id?: string
  options: SearchOption[]
  value?: string | number
  onChange?: SearchChange
  placeholder?: string
  searchPlaceholder?: string
  loading?: boolean
  emptyMessage?: string
  allowCustom?: boolean
  error?: string
  compact?: boolean
  onSearchChange?: (query: string) => void
}

/** Shared searchable dropdown used by form fields and all filter selects. */
export function SearchableSelect({
  id, options, value = '', onChange, placeholder = 'Select an option', searchPlaceholder = 'Search...',
  loading = false, emptyMessage = 'No results found', allowCustom = false, disabled, required, error, className = '', compact = false, onSearchChange,
  name, form, 'aria-label': ariaLabel,
}: SearchableSelectProps) {
  const generatedId = useId()
  const root = useRef<HTMLDivElement>(null)
  const menuRoot = useRef<HTMLDivElement>(null)
  const searchInput = useRef<HTMLInputElement>(null)
  const onSearchChangeRef = useRef(onSearchChange)
  useEffect(() => { onSearchChangeRef.current = onSearchChange }, [onSearchChange])
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null)
  const [listMaxHeight, setListMaxHeight] = useState(224)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const selected = String(value ?? '')
  const selectedOption = options.find((option) => option.value === selected)
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    return term ? options.filter((option) => `${option.label} ${option.value}`.toLocaleLowerCase().includes(term)) : options
  }, [options, query])
  const visibleOptions = filtered.slice(0, 100)
  const hasMoreMatches = filtered.length > visibleOptions.length
  const customAllowed = allowCustom && query.trim() !== '' && !options.some((option) => option.label.toLocaleLowerCase() === query.trim().toLocaleLowerCase())
  const hasSearch = options.length > 6
  const needsSearch = options.length > 100 && query.trim() === ''
  const resultCount = (needsSearch ? 0 : visibleOptions.length) + (customAllowed ? 1 : 0)

  useEffect(() => { if (open && hasSearch) requestAnimationFrame(() => searchInput.current?.focus()) }, [open, hasSearch])
  useEffect(() => {
    if (!open) return
    const positionMenu = () => {
      const rect = root.current?.getBoundingClientRect()
      if (!rect) return
      const roomBelow = window.innerHeight - rect.bottom
      const roomAbove = rect.top
      const up = roomBelow < 300 && roomAbove > roomBelow
      const available = Math.max(110, Math.min(310, (up ? roomAbove : roomBelow) - 8))
      const width = Math.min(rect.width, window.innerWidth - 16)
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
      setMenuStyle({ position: 'fixed', left, width, zIndex: 60, ...(up ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }), maxHeight: available })
      setListMaxHeight(Math.max(56, available - 54))
    }
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node
      if (!root.current?.contains(target) && !menuRoot.current?.contains(target)) setOpen(false)
    }
    positionMenu()
    if (hasSearch) requestAnimationFrame(() => searchInput.current?.focus())
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('scroll', positionMenu, true)
    window.addEventListener('resize', positionMenu)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('scroll', positionMenu, true)
      window.removeEventListener('resize', positionMenu)
    }
  }, [open, hasSearch])
  useEffect(() => {
    if (!open || resultCount === 0) return
    requestAnimationFrame(() => document.getElementById(`${id ?? generatedId}-option-${active}`)?.scrollIntoView({ block: 'nearest' }))
  }, [active, open, resultCount, id, generatedId])

  const choose = (next: string) => {
    onChange?.({ target: { value: next } })
    setOpen(false)
    requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>('[role="combobox"]')?.focus())
  }
  const openMenu = () => {
    setQuery('')
    setActive(0)
    onSearchChangeRef.current?.('')
    setOpen(true)
  }
  const moveActive = (direction: number) => {
    if (!resultCount) return
    setActive((index) => (index + direction + resultCount) % resultCount)
  }
  const keyDown = (event: KeyboardEvent<HTMLInputElement | HTMLButtonElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>('[role="combobox"]')?.focus()); return }
    if (event.key === 'ArrowDown') { event.preventDefault(); if (!open) openMenu(); else moveActive(1); return }
    if (event.key === 'ArrowUp') { event.preventDefault(); if (!open) openMenu(); else moveActive(-1); return }
    if (event.key === 'Enter' && !open) { event.preventDefault(); openMenu() }
    else if (event.key === 'Enter' && open && resultCount) {
      event.preventDefault()
      if (active < visibleOptions.length) choose(visibleOptions[active].value)
      else choose(query.trim())
    }
  }
  const controlClass = `${control} ${controlState(error)} ${compact ? 'h-10 pr-9 sm:w-auto' : 'h-11 pr-10'} ${className}`

  return (
    <div ref={root} className={`relative min-w-0 ${open ? 'z-40' : ''}`} onBlurCapture={(event) => {
      const target = event.relatedTarget as Node | null
      if (target && !root.current?.contains(target) && !menuRoot.current?.contains(target)) setOpen(false)
    }}>
      {name && <input type="hidden" name={name} form={form} value={selected} disabled={disabled} />}
      <button
        id={id ?? generatedId}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id ?? generatedId}-options`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id ?? generatedId}-error` : undefined}
        aria-required={required}
        disabled={disabled}
        onClick={() => { if (open) setOpen(false); else openMenu() }}
        onKeyDown={keyDown}
        className={`${controlClass} flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60 ${selected && !required ? 'pr-16' : ''}`}
      >
        <span className={`truncate ${selectedOption || selected ? 'text-ink' : 'text-muted'}`}>{selectedOption?.label ?? (selected || placeholder)}</span>
        <ChevronDown className={`size-4 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {selected && !required && <button type="button" aria-label="Clear selection" disabled={disabled} onClick={() => choose('')} className="absolute right-8 top-1/2 z-[1] -translate-y-1/2 rounded p-1 text-muted hover:bg-surface-2 hover:text-ink"><X className="size-3.5" /></button>}
      {open && createPortal(<div ref={menuRoot} style={menuStyle ?? { position: 'fixed', zIndex: 60, visibility: 'hidden' }} className="overflow-hidden rounded-lg border border-line-strong bg-white shadow-xl">
        {hasSearch && <div className="relative border-b border-line p-2">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            ref={searchInput}
            type="text"
            role="searchbox"
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => { setQuery(event.target.value); setActive(0); onSearchChange?.(event.target.value) }}
            aria-controls={`${id ?? generatedId}-options`}
            aria-activedescendant={resultCount ? `${id ?? generatedId}-option-${active}` : undefined}
            onKeyDown={keyDown}
            className="h-9 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
          />
        </div>}
        <div id={`${id ?? generatedId}-options`} role="listbox" style={{ maxHeight: hasSearch ? listMaxHeight : Math.min(listMaxHeight + 54, 310) }} className="overflow-y-auto overscroll-contain p-1">
          {loading ? <p className="px-3 py-2 text-sm text-muted">Searching...</p> : needsSearch ? <p className="px-3 py-2 text-sm text-muted">Type to search {options.length.toLocaleString()} options.</p> : visibleOptions.length === 0 && !customAllowed ? <p className="px-3 py-2 text-sm text-muted">{emptyMessage}</p> : <>
            {visibleOptions.map((option, index) => <button id={`${id ?? generatedId}-option-${index}`} key={option.value} type="button" tabIndex={-1} role="option" aria-selected={option.value === selected} onMouseEnter={() => setActive(index)} onClick={() => choose(option.value)} className={`flex min-h-9 w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm ${index === active ? 'bg-brand-50 text-brand-700' : 'text-ink hover:bg-surface-2'}`}>
              <span className="truncate">{option.label}</span>{option.value === selected && <Check className="size-4 shrink-0 text-brand-600" />}
            </button>)}
            {hasMoreMatches && <p className="px-3 py-2 text-xs text-muted">Showing the first 100 matches. Type more to narrow the list.</p>}
            {customAllowed && <button id={`${id ?? generatedId}-option-${visibleOptions.length}`} type="button" tabIndex={-1} role="option" aria-selected={active === visibleOptions.length} onMouseEnter={() => setActive(visibleOptions.length)} onClick={() => choose(query.trim())} className={`min-h-9 w-full rounded-md px-3 py-2 text-left text-sm ${active === visibleOptions.length ? 'bg-brand-50 text-brand-700' : 'text-ink hover:bg-surface-2'}`}>Use “{query.trim()}”</button>}
          </>}
        </div>
      </div>, document.body)}
    </div>
  )
}

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
  error?: string
  hint?: ReactNode
}

export function TextAreaField({ label, error, hint, required, className = '', rows = 3, ...rest }: TextAreaFieldProps) {
  const id = useId()
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint} required={required}>
      <textarea
        id={id}
        required={required}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${control} ${controlState(error)} min-h-28 resize-y py-2.5 leading-6 ${className}`}
        {...rest}
      />
    </FieldWrapper>
  )
}

/** Compact select used in filter bars (no label/wrapper). */
export function FilterSelect({
  options,
  className = '',
  ...rest
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange' | 'multiple' | 'size'> & { options: Array<{ value: string; label: string }>; value?: string | number; onChange?: SearchChange }) {
  return <SearchableSelect options={options} compact className={className} {...rest} />
}
