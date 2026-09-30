import type { ApprovalAction, ApprovalStatus, FieldGroup, Furnishing, StoredAreaUnit } from '../types'

export const FURNISHING_LABELS: Record<Furnishing, string> = {
  unfurnished: 'Unfurnished',
  semi_furnished: 'Semi-furnished',
  fully_furnished: 'Fully furnished',
}

export const AREA_UNIT_LABELS: Record<StoredAreaUnit, string> = {
  sq_ft: 'Sq.ft',
  sq_meter: 'Sq. Meter (legacy)',
  sq_yard: 'Sq. Yard (legacy)',
  cent: 'Cent',
  acre: 'Acre',
  ground: 'Ground (legacy)',
  hectare: 'Hectare (legacy)',
}

export const PROPERTY_FACING_LABELS = {
  north: 'North',
  south: 'South',
  east: 'East',
  west: 'West',
  north_east: 'North-East',
  north_west: 'North-West',
  south_east: 'South-East',
  south_west: 'South-West',
} as const

export const FIELD_GROUP_LABELS: Record<FieldGroup, string> = {
  rental: 'Rental details',
  residential: 'Residential details',
  commercial: 'Commercial details',
  general: 'General details',
}

/** Type-specific fields per field group — mirrors Records::GROUP_FIELDS in the backend. */
export const GROUP_FIELDS: Record<FieldGroup, string[]> = {
  rental: ['rental_amount', 'security_deposit', 'furnishing', 'bedrooms', 'bathrooms'],
  residential: ['bedrooms', 'bathrooms', 'furnishing', 'sale_amount', 'market_price'],
  commercial: ['commercial_usage', 'sale_amount', 'market_price', 'rental_amount'],
  general: ['sale_amount', 'market_price', 'rental_amount'],
}

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const plain = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })
export const formatEnteredArea = (value: number | null | undefined, unit: StoredAreaUnit | null | undefined) =>
  value == null ? formatArea(value) : `${plain.format(value)} ${AREA_UNIT_LABELS[unit ?? 'sq_ft']}`

export const formatCurrency = (value: number | null | undefined) => (value == null ? '—' : inr.format(value))
export const formatArea = (value: number | null | undefined) => (value == null ? '—' : `${plain.format(value)} sq.ft.`)

/** "+919876543210" → "+91 98765 43210"; other numbers are shown as stored. */
export function formatPhone(phone: string | null | undefined) {
  if (!phone) return '—'
  const india = /^\+91(\d{5})(\d{5})$/.exec(phone)
  return india ? `+91 ${india[1]} ${india[2]}` : phone
}

/** WhatsApp click-to-chat and tel: links for an E.164 number (no WhatsApp Business API needed). */
export function phoneLinks(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return {
    whatsapp: `https://wa.me/${digits}`,
    call: `tel:${phone.startsWith('+') ? phone : `+${digits}`}`,
  }
}

export function locationLabel(record: { locality: string | null; city: string }) {
  return record.locality ? `${record.locality}, ${record.city}` : record.city
}

export const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  draft: 'Draft',
  pending: 'Pending approval',
  approved: 'Approved',
  rejected: 'Rejected',
}

export const APPROVAL_ACTION_LABELS: Record<ApprovalAction, string> = {
  created_draft: 'Saved as draft',
  created_approved: 'Created directly by Admin (approved)',
  submitted: 'Submitted for approval',
  resubmitted: 'Resubmitted for approval',
  edited: 'Edited while pending',
  approved: 'Approved',
  rejected: 'Rejected',
}
