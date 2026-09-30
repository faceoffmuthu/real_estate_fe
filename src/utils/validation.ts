/*
 * Client-side validation mirroring backend/core/Validator.php.
 * This is for user experience only — the backend re-validates everything.
 */

export type FieldErrors = Record<string, string>

export const PASSWORD_HINT = 'At least 8 characters with an uppercase letter, a lowercase letter and a number.'

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
    const n = Number(value)
    if (Number.isNaN(n)) return `${label} must be a number.`
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
