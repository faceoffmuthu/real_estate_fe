import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'

type Tone = 'info' | 'success' | 'warning' | 'error'

const styles: Record<Tone, { box: string; icon: ReactNode }> = {
  info: { box: 'border-info/20 bg-info-soft text-info', icon: <Info className="size-4" /> },
  success: { box: 'border-success/20 bg-success-soft text-success', icon: <CheckCircle2 className="size-4" /> },
  warning: { box: 'border-warning/20 bg-warning-soft text-warning', icon: <AlertTriangle className="size-4" /> },
  error: { box: 'border-danger/20 bg-danger-soft text-danger', icon: <XCircle className="size-4" /> },
}

interface AlertProps {
  tone?: Tone
  title?: string
  children?: ReactNode
  onDismiss?: () => void
  action?: ReactNode
}

export function Alert({ tone = 'info', title, children, onDismiss, action }: AlertProps) {
  const s = styles[tone]
  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${s.box}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span className="mt-0.5 shrink-0">{s.icon}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={title ? 'mt-0.5 text-ink-soft' : ''}>{children}</div>}
      </div>
      {action}
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Dismiss">
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
