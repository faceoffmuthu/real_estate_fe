/*
 * Client-side validation mirroring backend/core/Validator.php.
 * This is for user experience only — the backend re-validates everything.
 */

export type FieldErrors = Record<string, string>

export const PASSWORD_HINT = 'At least 8 characters with an uppercase letter, a lowercase letter and a number.'

/**
 * Parses normal decimals and amounts grouped with Indian/standard separators.
 * Examples: 2.05,00,000 → 20500000 and 2,05,00,000.50 → 20500000.5.
 */
export function parseFormattedNumber(value: string): number | null {
  const raw = value.trim().replace(/\s+/g, '')
  if (!raw || !/^\d+(?:[.,]\d+)*$/.test(raw)) return null

  const lastSeparator = Math.max(raw.lastIndexOf('.'), raw.lastIndexOf(','))
  const fraction = lastSeparator === -1 ? '' : raw.slice(lastSeparator + 1)
  // A final group of up to two digits is a decimal; three digits is a
  // thousands/lakh group (for example, 2.05,00,000).
  const hasDecimal = lastSeparator !== -1 && fraction.length <= 2
  const integer = (hasDecimal ? raw.slice(0, lastSeparator) : raw).replace(/[.,]/g, '')
  const normalized = hasDecimal ? `${integer}.${fraction}` : integer
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export const rules = {
  required: (value: string, label: string) => (value.trim() === '' ? `${label} is required.` : null),
  email: (value: string) =>
    value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? 'Email must be a valid email address.' : null,
  username: (value: string) =>
    value.trim() && !/^[a-zA-Z0-9._]{3,50}$/.test(value.trim())
      ? 'Username must be 3-50 characters: letters, numbers, dots or underscores.'
      : null,
  phone: (value: string) =>
    value.trim() && !/^\+?[0-9\s\-()]{7,20}$/.test(value.trim())
      ? 'Phone must be 7-20 digits and may include +, spaces, dashes or brackets.'
      : null,
  password: (value: string) =>
    value &&
    (value.length < 8 || value.length > 72 || !/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value))
      ? `Password must be ${PASSWORD_HINT.charAt(0).toLowerCase()}${PASSWORD_HINT.slice(1)}`
      : null,
  /** Party phone: 10-digit mobile or number with country code (backend normalises to E.164). */
  partyPhone: (value: string) => {
    if (!value.trim()) return null
    const digits = value.replace(/\D/g, '')
    return /^\+?[0-9\s\-().]{7,25}$/.test(value.trim()) && digits.length >= 8 && digits.length <= 15
      ? null
      : 'Enter a valid phone number (10-digit mobile or with country code).'
  },
  localPhone: (value: string, optional = false) => {
    if (!value.trim() && optional) return null
    if (/\D/.test(value)) return 'Enter digits only, without spaces or country code.'
    return value.length !== 10 ? 'Phone number must contain exactly 10 digits.' : null
  },
  number: (value: string, label: string, min: number, max: number, integer = false) => {
    if (!value.trim()) return null
    const n = parseFormattedNumber(value)
    if (n === null) return `${label} must be a number.`
    if (integer && !Number.isInteger(n)) return `${label} must be a whole number.`
    return n < min || n > max ? `${label} must be between ${min} and ${max.toLocaleString('en-IN')}.` : null
  },
  pincode: (value: string) => (value.trim() && !/^[0-9]{6}$/.test(value.trim()) ? 'Pincode must be exactly 6 digits.' : null),
  length: (value: string, label: string, min: number, max: number) => {
    const len = value.trim().length
    if (!len) return null
    if (len < min) return `${label} must be at least ${min} characters.`
    if (len > max) return `${label} must not exceed ${max} characters.`
    return null
  },
}

/** Runs checks per field and keeps the first error for each. */
export function validate(checks: Record<string, Array<string | null>>): FieldErrors {
  const errors: FieldErrors = {}
  for (const [field, results] of Object.entries(checks)) {
    const first = results.find((r) => r)
    if (first) errors[field] = first
  }
  return errors
}
