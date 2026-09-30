import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, onUnauthorized } from '../services/api'
import type { User } from '../types'

type AuthStatus = 'loading' | 'authenticated' | 'guest'

export interface AuthContextValue {
  status: AuthStatus
  user: User | null
  settings: Record<string, string | null>
  /** True when the session ended because the backend returned 401. */
  sessionExpired: boolean
  login: (login: string, password: string) => Promise<User>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [settings, setSettings] = useState<Record<string, string | null>>({})
  const [sessionExpired, setSessionExpired] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const data = await authApi.me()
      setUser(data.user)
      setSettings(data.settings)
      setStatus('authenticated')
    } catch {
      setUser(null)
      setStatus('guest')
    }
  }, [])

  // Restore the session from the HttpOnly cookie on first load.
  useEffect(() => {
    void refresh()
  }, [refresh])

  // Any API call returning 401 ends the client session.
  useEffect(
    () =>
      onUnauthorized(() => {
        setUser(null)
        setStatus('guest')
        setSessionExpired(true)
      }),
    [],
  )

  const login = useCallback(async (loginId: string, password: string) => {
    const data = await authApi.login(loginId, password)
    setSessionExpired(false)
    setUser(data.user)
    setStatus('authenticated')
    // Load public settings in the background; the backend is the source of truth for the role.
    authApi.me().then((me) => setSettings(me.settings)).catch(() => {})
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
      setSessionExpired(false)
      setStatus('guest')
    }
  }, [])

  const value = useMemo(
    () => ({ status, user, settings, sessionExpired, login, logout, refresh }),
    [status, user, settings, sessionExpired, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
