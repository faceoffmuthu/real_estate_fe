import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { notificationsApi } from '../services/api'
import type { NotificationItem } from '../types'

const POLL_MS = 60_000

interface NotificationsValue {
  items: NotificationItem[]
  unreadCount: number
  /** Admin only: records waiting for this Admin's review (sidebar badge). */
  pendingApprovals: number | null
  refresh: () => void
  markRead: (ids: number[]) => Promise<void>
  markAllRead: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsValue>({
  items: [],
  unreadCount: 0,
  pendingApprovals: null,
  refresh: () => {},
  markRead: async () => {},
  markAllRead: async () => {},
})

/** Polls the in-app notifications endpoint (one request per minute, and on demand). */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingApprovals, setPendingApprovals] = useState<number | null>(null)
  const inFlight = useRef<AbortController | null>(null)

  const refresh = useCallback(() => {
    inFlight.current?.abort()
    const controller = new AbortController()
    inFlight.current = controller
    notificationsApi
      .list(controller.signal)
      .then((data) => {
        setItems(data.items)
        setUnreadCount(data.unread_count)
        setPendingApprovals(data.pending_approvals)
      })
      .catch(() => {
        // Notifications are non-critical; a failed poll is retried on the next tick.
      })
  }, [])

  useEffect(() => {
    refresh()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh()
    }, POLL_MS)
    return () => {
      clearInterval(timer)
      inFlight.current?.abort()
    }
  }, [refresh])

  const markRead = useCallback(
    async (ids: number[]) => {
      if (ids.length === 0) return
      setItems((list) => list.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)))
      await notificationsApi.markRead(ids).catch(() => {})
      refresh()
    },
    [refresh],
  )

  const markAllRead = useCallback(async () => {
    setItems((list) => list.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    await notificationsApi.markAllRead().catch(() => {})
    refresh()
  }, [refresh])

  const value = useMemo(
    () => ({ items, unreadCount, pendingApprovals, refresh, markRead, markAllRead }),
    [items, unreadCount, pendingApprovals, refresh, markRead, markAllRead],
  )
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  return useContext(NotificationsContext)
}
