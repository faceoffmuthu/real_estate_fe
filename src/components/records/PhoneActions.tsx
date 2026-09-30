import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Phone } from 'lucide-react'
import { formatPhone, phoneLinks } from '../../utils/records'

/**
 * Clickable phone number. Clicking opens a small menu with
 * WhatsApp (wa.me click-to-chat) and Call (device tel: handler).
 */
export function PhoneActions({ phone, label }: { phone: string; label?: string }) {
  // Fixed-position menu so it is not clipped by scrollable table containers.
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const links = phoneLinks(phone)
  const open = position !== null
  const setOpen = (value: boolean | ((o: boolean) => boolean)) => {
    const next = typeof value === 'function' ? value(open) : value
    if (!next || !ref.current) return setPosition(null)
    const rect = ref.current.getBoundingClientRect()
    setPosition({ top: rect.bottom + 4, left: Math.max(8, Math.min(rect.left, window.innerWidth - 240)) })
  }

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setPosition(null)
    }
    const dismiss = () => setPosition(null)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPosition(null)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('resize', dismiss)
    }
  }, [open])

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 font-medium whitespace-nowrap text-brand-500 underline-offset-2 hover:bg-brand-50 hover:underline"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Contact options for ${label ?? formatPhone(phone)}`}
      >
        <Phone className="size-3.5" />
        {formatPhone(phone)}
      </button>
      {position && (
        <div role="menu" style={position} className="fixed z-40 flex gap-2 rounded-lg border border-line bg-surface p-2 shadow-lg">
          <a
            role="menuitem"
            href={links.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-success px-3 text-sm font-medium whitespace-nowrap text-white hover:bg-success/90"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
          <a
            role="menuitem"
            href={links.call}
            onClick={() => setOpen(false)}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-sm font-medium whitespace-nowrap text-ink hover:bg-surface-3"
          >
            <Phone className="size-4" /> Call
          </a>
        </div>
      )}
    </div>
  )
}
