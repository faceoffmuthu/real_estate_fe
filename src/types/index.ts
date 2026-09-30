export type Role = 'super_admin' | 'admin' | 'user'
export type AccountStatus = 'active' | 'inactive'

export interface ApiSuccess<T> {
  success: true
  message: string
  data: T
}

export interface ApiFailure {
  success: false
  message: string
  errors: Record<string, string>
}

export interface Pagination {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface Paginated<T> {
  items: T[]
  pagination: Pagination
}

export interface User {
  id: number
  name: string
  username: string
  email: string
  phone: string | null
  role: Role
  role_name: string
  status: AccountStatus
  manager: { id: number; name: string | null } | null
  last_login_at: string | null
  created_at: string
  updated_at: string | null
  managed_users_count?: number
}

export interface ActivityEntry {
  id: number
  action: string
  description: string
  entity_type: string | null
  entity_id: number | null
  ip_address: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  user: { id: number; name: string; role: Role } | null
}

export interface TrendPoint {
  date: string
  count: number
}

export interface SuperAdminDashboard {
  stats: {
    total_admins: number
    active_admins: number
    total_users: number
    active_users: number
    active_accounts: number
    inactive_accounts: number
    total_accounts: number
    logins_24h: number
    failed_logins_24h: number
    denied_requests_24h: number
    events_24h: number
    active_sessions: number
  }
  activity_trend: TrendPoint[]
  recent_activity: ActivityEntry[]
  recent_accounts: Pick<User, 'id' | 'name' | 'email' | 'role' | 'status' | 'created_at'>[]
  records: RecordStats
  approvals: { recent_approved: ApprovalHistoryEntry[]; recent_rejected: ApprovalHistoryEntry[] }
}

export interface AdminDashboard {
  stats: {
    total_users: number
    active_users: number
    inactive_users: number
    new_users_30d: number
    users_active_7d: number
    team_logins_7d: number
  }
  activity_trend: TrendPoint[]
  recent_activity: ActivityEntry[]
  records: RecordStats
  approvals: Paginated<RecordSummary> & { recent_activity: ApprovalHistoryEntry[] }
}

export interface UserDashboard {
  account: User
  stats: {
    total_logins: number
    activity_30d: number
    total_activity: number
    account_age_days: number
  }
  activity_trend: TrendPoint[]
  recent_activity: ActivityEntry[]
  records: RecordStats
  approvals: { rejected: RecordSummary[]; recent_activity: ApprovalHistoryEntry[] }
}

export interface RoleOption {
  slug: Role
  name: string
  description: string | null
}

export interface Setting {
  key: string
  value: string | null
  type: 'string' | 'email' | 'phone' | 'int' | 'bool'
  label: string
  description: string | null
  is_public: boolean
  updated_at: string
  updated_by: string | null
}

export interface UserPayload {
  name?: string
  username?: string
  email?: string
  phone?: string
  password?: string
  role?: Role
  manager_id?: number
  status?: AccountStatus
}

// ---------------------------------------------------------------------
// Phase 2 — records
// ---------------------------------------------------------------------

export type FieldGroup = 'rental' | 'residential' | 'commercial' | 'general'
export type RecordPurpose = 'sale' | 'rent' | 'lease' | 'purchase' | 'other'
export type Furnishing = 'unfurnished' | 'semi_furnished' | 'fully_furnished'
export type AreaUnit = 'sq_ft' | 'acre' | 'cent'
export type LegacyAreaUnit = 'sq_meter' | 'sq_yard' | 'ground' | 'hectare'
export type StoredAreaUnit = AreaUnit | LegacyAreaUnit
export type PropertyFacing = 'north' | 'south' | 'east' | 'west' | 'north_east' | 'north_west' | 'south_east' | 'south_west'
export type RecordStatus = 'active' | 'archived'

export interface PropertyType {
  id: number
  slug: string
  name: string
  field_group: FieldGroup
  description: string | null
  is_active: boolean
  sort_order: number
  record_count: number | null
  updated_at: string
}

export interface PropertyCategory {
  id: number
  slug: 'residential' | 'commercial'
  name: string
  sort_order: number
}

export interface ProcessStage {
  id: number
  slug: string
  name: string
  is_final: boolean
}

export interface Party {
  id: number
  name: string
  phone: string
  alt_phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  record_count: number
  created_by: { id: number; name: string } | null
  updated_by: string | null
  created_at: string
  updated_at: string
  can_edit?: boolean
}

export interface PartyPayload {
  name: string
  phone: string
  alt_phone?: string
  email?: string
  address?: string
  notes?: string
}

export interface RecordSummary {
  priority: string
  contact_status: string
  assigned_to: number | null
  next_action: string | null
  last_contacted_at: string | null
  id: number
  reference: string
  title: string
  property_type: { id: number; name: string; slug: string; field_group: FieldGroup }
  transaction_type: 'rental' | 'sale' | null
  property_category_id: number | null
  property_category: 'residential' | 'commercial' | null
  purpose: RecordPurpose | null
  party: { id: number; name: string; phone: string }
  locality: string | null
  city: string
  area_sqft: number | null
  area_value: number | null
  area_unit: StoredAreaUnit | null
  process_stage: { id: number; name: string; slug: string; is_final: boolean }
  record_status: RecordStatus
  approval: RecordApproval
  created_by: { id: number; name: string; role: Role }
  created_at: string
  updated_at: string
}

/** Approval workflow status (Phase 3) — separate from the business process stage. */
export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected'

export interface RecordApproval {
  status: ApprovalStatus
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: { id: number; name: string } | null
  rejection_reason: string | null
}

export type ApprovalAction = 'created_draft' | 'created_approved' | 'submitted' | 'resubmitted' | 'edited' | 'approved' | 'rejected'

export interface ApprovalHistoryEntry {
  id: number
  record: { id: number; reference: string; title: string }
  action: ApprovalAction
  previous_status: ApprovalStatus | null
  new_status: ApprovalStatus
  reason: string | null
  performed_by: { id: number; name: string; role: Role } | null
  created_at: string
}

export interface NotificationItem {
  id: number
  type: string
  title: string
  message: string
  entity_type: string | null
  entity_id: number | null
  read: boolean
  created_at: string
}

export interface RecordDetail extends RecordSummary {
  description: string | null
  address_line: string | null
  district: string | null
  state: string | null
  pincode: string | null
  map_url: string | null
  property_facing: PropertyFacing | null
  area_value: number | null
  area_unit: StoredAreaUnit | null
  dimensions: string | null
  floor_details: string | null
  bedrooms: number | null
  bathrooms: number | null
  furnishing: Furnishing | null
  commercial_usage: string | null
  rental_amount: number | null
  security_deposit: number | null
  sale_amount: number | null
  market_price: number | null
  process_notes: string | null
  updated_by: { id: number; name: string } | null
}

export interface PropertyMedia {
  id: number
  record_id: number
  media_type: 'image' | 'video'
  file_name: string
  mime_type: string
  file_size: number
  created_at: string
  url: string
}

export interface RecordPayload {
  title: string
  property_type_id: number | ''
  transaction_type: 'rental' | 'sale' | ''
  property_category_id: number | ''
  property_category: 'residential' | 'commercial' | ''
  description?: string
  address_line: string
  locality: string
  city: string
  district: string
  state: string
  pincode: string
  map_url: string
  area_sqft: string
  area_value: string
  area_unit?: AreaUnit | ''
  dimensions: string
  floor_details: string
  property_facing: PropertyFacing | ''
  bedrooms: string
  bathrooms: string
  furnishing: Furnishing | ''
  commercial_usage: string
  rental_amount: string
  security_deposit: string
  sale_amount: string
  market_price: string
  process_stage_id: number | ''
  process_notes?: string
  record_status?: RecordStatus
  /** Users: true = submit / resubmit for approval after saving. */
  submit?: boolean
  party_id?: number
  party_phone?: string
  party?: PartyPayload
  confirm_new_party?: boolean
}

export interface RecordStats {
  total: number
  by_type: Array<{ id: number; slug: string; name: string; field_group: FieldGroup; total: number }>
  by_classification: Array<{ transaction_type: 'rental' | 'sale' | null; property_category: 'residential' | 'commercial' | null; total: number }>
  by_stage: Array<{ id: number; slug: string; name: string; total: number }>
  by_approval: Record<ApprovalStatus, number>
  recent: RecordSummary[]
}
