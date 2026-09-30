import type { ApiFailure, ApiSuccess } from '../../types'
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config'

/** Error thrown for any failed API call, carrying the backend message and field errors. */
export class ApiError extends Error {
  readonly status: number
  readonly errors: Record<string, string>

  constructor(message: string, status: number, errors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }

  get isUnauthorized() {
    return this.status === 401
  }
  get isForbidden() {
    return this.status === 403
  }
  get isValidation() {
    return this.status === 422
  }
}

type Listener = () => void
const unauthorizedListeners = new Set<Listener>()

/** Lets the auth context react when any request reports an expired session. */
export function onUnauthorized(listener: Listener) {
  unauthorizedListeners.add(listener)
  return () => {
    unauthorizedListeners.delete(listener)
  }
}

type Query = Record<string, string | number | undefined | null>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Query
  body?: unknown
  signal?: AbortSignal
  /** Do not broadcast 401 (used by the initial session check and login). */
  silent401?: boolean
}

function buildUrl(path: string, query?: Query) {
  const url = `${API_BASE_URL}/${path.replace(/^\//, '')}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

/** Performs a request and returns `data`. Throws ApiError on any failure. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return (await send<T>(path, options)).data
}

/** Performs a request and returns `{ data, message }` — used for mutations that show the backend message. */
export async function send<T>(path: string, options: RequestOptions = {}): Promise<ApiSuccess<T>> {
  const { method = 'GET', query, body, signal, silent401 } = options
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
      },
      body: method !== 'GET' ? JSON.stringify(body ?? {}) : undefined,
      signal: combined,
    })
  } catch (err) {
    if (signal?.aborted) throw err
    if (timeout.aborted) throw new ApiError('The server took too long to respond. Please try again.', 0)
    throw new ApiError('Unable to reach the server. Check your connection and that the backend is running.', 0)
  }

  let payload: ApiSuccess<T> | ApiFailure | null = null
  try {
    payload = await response.json()
  } catch {
    // Non-JSON response (e.g. Apache error page) handled below.
  }

  if (!response.ok || !payload || payload.success !== true) {
    const message =
      payload && 'message' in payload && payload.message
        ? payload.message
        : `Unexpected server response (${response.status}). Please try again.`
    const errors = payload && payload.success === false && !Array.isArray(payload.errors) ? payload.errors : {}
    if (response.status === 401 && !silent401) unauthorizedListeners.forEach((fn) => fn())
    throw new ApiError(message, response.status, errors)
  }

  return payload
}
