import type {
  ActivityEntry,
  AdminDashboard,
  ApprovalHistoryEntry,
  NotificationItem,
  FieldGroup,
  Paginated,
  Party,
  PartyPayload,
  ProcessStage,
  PropertyType,
  PropertyCategory,
  RecordDetail,
  RecordPayload,
  RecordSummary,
  RoleOption,
  Setting,
  SuperAdminDashboard,
  User,
  UserDashboard,
  UserPayload,
} from '../../types'
import { ApiError, request, send } from './client'
import { API_BASE_URL } from './config'
import type { PropertyMedia } from '../../types'

export { ApiError, onUnauthorized } from './client'

export const authApi = {
  forgot: (email: string) => send<null>('auth/forgot-password.php', { method: 'POST', body: {email} }),
  forgotSelf: () => send<null>('auth/forgot-password-self.php', { method: 'POST', body: {} }),
  reset: (token: string, password: string, password_confirmation: string) => send<null>('auth/reset-password.php', { method: 'POST', body: {token, password, password_confirmation} }),
  login: (login: string, password: string) =>
    request<{ user: User }>('auth/login.php', { method: 'POST', body: { login, password }, silent401: true }),
  logout: () => request<null>('auth/logout.php', { method: 'POST' }),
  me: () => request<{ user: User; settings: Record<string, string | null> }>('auth/me.php', { silent401: true }),
  changePassword: (body: { current_password: string; new_password: string; confirm_password: string }) =>
    send<null>('auth/change-password.php', { method: 'POST', body }),
}

export const dashboardApi = {
  superAdmin: (signal?: AbortSignal) => request<SuperAdminDashboard>('dashboard/super-admin.php', { signal }),
  admin: (signal?: AbortSignal) => request<AdminDashboard>('dashboard/admin.php', { signal }),
  user: (signal?: AbortSignal) => request<UserDashboard>('dashboard/user.php', { signal }),
}

export interface UserListQuery {
  role?: string
  status?: string
  search?: string
  manager_id?: number
  page?: number
  per_page?: number
  [key: string]: string | number | undefined
}

export const usersApi = {
  list: (query: UserListQuery, signal?: AbortSignal) => request<Paginated<User>>('users/list.php', { query, signal }),
  view: (id: number, signal?: AbortSignal) =>
    request<{ user: User; recent_activity: ActivityEntry[] }>('users/view.php', { query: { id }, signal }),
  create: (body: UserPayload) => send<{ user: User }>('users/create.php', { method: 'POST', body }),
  update: (id: number, body: UserPayload) => send<{ user: User }>('users/update.php', { method: 'PUT', body: { id, ...body } }),
}

export interface ActivityQuery {
  action?: string
  user_id?: number
  search?: string
  page?: number
  per_page?: number
  [key: string]: string | number | undefined
}

export const activityApi = {
  list: (query: ActivityQuery, signal?: AbortSignal) =>
    request<Paginated<ActivityEntry> & { actions: string[] }>('activity/list.php', { query, signal }),
}

export const rolesApi = {
  list: (signal?: AbortSignal) => request<{ items: RoleOption[] }>('roles/list.php', { signal }),
}

export const settingsApi = {
  list: (signal?: AbortSignal) => request<{ items: Setting[] }>('settings/list.php', { signal }),
  update: (settings: Record<string, string>) =>
    send<{ updated: string[] }>('settings/update.php', { method: 'PUT', body: { settings } }),
}

// ---------------------------------------------------------------------
// Phase 2 — records
// ---------------------------------------------------------------------

export const propertyTypesApi = {
  list: (includeInactive = false, signal?: AbortSignal) =>
    request<{ items: PropertyType[] }>('property-types/list.php', { query: { include_inactive: includeInactive ? 1 : undefined }, signal }),
  create: (body: { name: string; field_group: FieldGroup; description?: string; sort_order?: number | '' }) =>
    send<{ id: number }>('property-types/create.php', { method: 'POST', body }),
  update: (body: { id: number; name: string; field_group: FieldGroup; description?: string; sort_order?: number | ''; is_active: boolean }) =>
    send<{ id: number }>('property-types/update.php', { method: 'PUT', body }),
}

export interface ReportsQuery {
  [key: string]: string | number | undefined
  report: 'properties' | 'approvals' | 'followups' | 'activity'
  search?: string
  from?: string
  to?: string
  transaction_type?: string
  property_category?: string
  approval_status?: string
  process_stage_id?: number | string
  created_by?: number | string
  assigned_to?: number | string
  priority?: string
  type?: string
  action?: string
  city?: string
  page?: number
  per_page?: number
  sort?: string
  direction?: string
}

export interface ReportsSummary {
  stats: Record<string, number>
  by_combination: Array<{ transaction_type: string | null; property_category: string | null; total: number }>
  by_approval: Array<{ status: string; total: number }>
  by_stage: Array<{ id: number; slug: string; name: string; total: number }>
  created_by_month: Array<{ month: string; total: number }>
  by_location: Array<{ location: string; total: number; rental: number; sale: number }>
  financial: { monthly_rent_total: number | null; rental_deposit_total: number | null; sale_price_total: number | null; sale_price_per_sqft_avg: number | null }
  user_performance: Array<Record<string, string | number>>
}

export const reportsApi = {
  summary: (signal?: AbortSignal) => request<ReportsSummary>('reports/summary.php', { signal }),
  list: (query: ReportsQuery, signal?: AbortSignal) => request<{ items: Array<Record<string, string | number | null>>; pagination: { page: number; per_page: number; total: number; total_pages: number }; export_limit: number }>('reports/list.php', { query, signal }),
  downloadCsv: async (query: ReportsQuery) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries({ ...query, format: 'csv' })) if (value !== undefined && value !== '') params.set(key, String(value))
    const response = await fetch(`${API_BASE_URL}/reports/list.php?${params}`, { credentials: 'include', headers: { Accept: 'text/csv' } })
    if (!response.ok) throw new Error(response.status === 401 ? 'Your session has expired. Sign in again.' : 'Could not export this report.')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `n-real-estate-${query.report}-report.csv`
    link.click()
    URL.revokeObjectURL(url)
  },
}

export const propertyCategoriesApi = {
  list: (signal?: AbortSignal) => request<{ items: PropertyCategory[] }>('property-categories/list.php', { signal }),
}

export const processStagesApi = {
  list: (signal?: AbortSignal) => request<{ items: ProcessStage[] }>('process-stages/list.php', { signal }),
}

export interface RecordListQuery {
  search?: string
  property_type_id?: number | string
  transaction_type?: string
  property_category?: string
  process_stage_id?: number | string
  city?: string
  created_from?: string
  created_to?: string
  record_status?: string
  approval_status?: string
  created_by?: number | string
  page?: number
  per_page?: number
  [key: string]: string | number | undefined
}

export const recordsApi = {
  lookupMap: (map_url: string) =>
    request<{ location: { address_line: string | null; locality: string | null; city: string | null; district: string | null; state: string | null; pincode: string | null; display_name: string; attribution: string } }>(
      'records/map-lookup.php',
      { method: 'POST', body: { map_url } },
    ),
  list: (query: RecordListQuery, signal?: AbortSignal) =>
    request<Paginated<RecordSummary> & { cities: string[]; assignees: Array<{id: number; name: string}>; creators: Array<{ id: number; name: string }>; can_create: boolean }>(
      'records/list.php',
      { query, signal },
    ),
  view: (id: number, signal?: AbortSignal) =>
    request<{
      record: RecordDetail
      media: PropertyMedia[]
      party: Pick<Party, 'id' | 'name' | 'phone' | 'alt_phone' | 'email' | 'address' | 'notes'>
      crm_assignees: Array<{id: number; name: string}>
      can_manage_crm: boolean
      can_edit: boolean
      edit_mode: 'all' | 'progress' | 'none'
      can_review: boolean
      can_submit: boolean
      approval_history: ApprovalHistoryEntry[]
      activity: ActivityEntry[]
    }>('records/view.php', { query: { id }, signal }),
  create: (body: RecordPayload) => send<{ record: RecordDetail }>('records/create.php', { method: 'POST', body }),
  createWithMedia: async (body: RecordPayload, files: File[]) => {
    const form = new FormData()
    form.append('payload', JSON.stringify(body))
    files.forEach(file => form.append(file.type.startsWith('video/') ? 'videos[]' : 'images[]', file))
    const response = await fetch(`${API_BASE_URL}/records/create.php`, { method: 'POST', credentials: 'include', headers: { Accept: 'application/json' }, body: form })
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.success) throw new ApiError(payload?.message || 'Could not create property.', response.status, payload?.errors || {})
    return payload as { success: true; message: string; data: { record: RecordDetail } }
  },
  update: (id: number, body: RecordPayload) => send<{ record: RecordDetail }>('records/update.php', { method: 'PUT', body: { id, ...body } }),
  uploadMedia: async (id: number, files: File[]) => {
    const form = new FormData()
    form.append('record_id', String(id))
    files.forEach(file => form.append(file.type.startsWith('video/') ? 'videos[]' : 'images[]', file))
    const response = await fetch(`${API_BASE_URL}/property-media/upload.php`, { method: 'POST', credentials: 'include', headers: { Accept: 'application/json' }, body: form })
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.success) throw new ApiError(payload?.message || 'Could not upload property media.', response.status)
    return payload as { success: true; message: string; data: { items: PropertyMedia[] } }
  },
  deleteMedia: (id: number) => send<null>('property-media/delete.php', { method: 'POST', body: { id } }),
  mediaUrl: (id: number) => `${API_BASE_URL}/property-media/file.php?id=${id}`,
  /** Submit a draft or resubmit a rejected record (User). */
  submit: (id: number) => send<{ record: RecordDetail }>('records/submit.php', { method: 'POST', body: { id } }),
}

export const locationsApi = {
  india: (signal?: AbortSignal) => request<{ states: string[]; districts: Record<string, string[]> }>('locations/india.php', { signal }),
  cities: (search: string, signal?: AbortSignal) => request<{ items: string[] }>('locations/cities.php', { query: { search }, signal }),
}

// ---------------------------------------------------------------------
// Phase 3 — approvals & notifications
// ---------------------------------------------------------------------

export interface ApprovalQueueQuery {
  search?: string
  property_type_id?: number | string
  process_stage_id?: number | string
  created_by?: number | string
  submitted_from?: string
  submitted_to?: string
  page?: number
  per_page?: number
  [key: string]: string | number | undefined
}

export const approvalsApi = {
  pending: (query: ApprovalQueueQuery, signal?: AbortSignal) =>
    request<Paginated<RecordSummary> & { can_review: boolean }>('approvals/pending.php', { query, signal }),
  approve: (id: number) => send<{ record: RecordDetail }>('approvals/approve.php', { method: 'POST', body: { id } }),
  reject: (id: number, reason: string) => send<{ record: RecordDetail }>('approvals/reject.php', { method: 'POST', body: { id, reason } }),
  history: (query: { action?: string; page?: number; per_page?: number }, signal?: AbortSignal) =>
    request<Paginated<ApprovalHistoryEntry>>('approvals/history.php', { query, signal }),
}

export const notificationsApi = {
  list: (signal?: AbortSignal) =>
    request<{ items: NotificationItem[]; unread_count: number; pending_approvals: number | null }>('notifications/list.php', {
      query: { limit: 15 },
      signal,
    }),
  markRead: (ids: number[]) => request<{ updated: number }>('notifications/mark-read.php', { method: 'POST', body: { ids } }),
  markAllRead: () => request<{ updated: number }>('notifications/mark-all-read.php', { method: 'POST' }),
}

export const partiesApi = {
  list: (query: { search?: string; page?: number; per_page?: number }, signal?: AbortSignal) =>
    request<Paginated<Party>>('parties/list.php', { query, signal }),
  view: (id: number, signal?: AbortSignal) => request<{ party: Party; records: RecordSummary[] }>('parties/view.php', { query: { id }, signal }),
  lookup: (phone: string, signal?: AbortSignal) =>
    request<{ phone: string; matches: Array<{ id: number; name: string; phone: string }> }>('parties/lookup.php', { query: { phone }, signal }),
  update: (id: number, body: PartyPayload) => send<{ party: Party }>('parties/update.php', { method: 'PUT', body: { id, ...body } }),
}
