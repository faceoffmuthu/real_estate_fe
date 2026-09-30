/**
 * Central API configuration. Every request goes through API_BASE_URL.
 * Development: `/api` (proxied by Vite to Apache/XAMPP).
 * Production: set VITE_API_BASE_URL at build time.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export const REQUEST_TIMEOUT_MS = 20_000
