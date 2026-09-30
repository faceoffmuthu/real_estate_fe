import type { ActivityEntry, Paginated } from '../../types'
import { request, send } from './client'

export interface FollowUp {
  id: number; record_id: number; reference: string; title: string
  assigned_to: number; assigned_name: string; due_at: string; type: string
  notes: string | null; status: string; completed_at: string | null
}
export interface FollowUpPayload {
  record_id: number; assigned_to: number; due_at: string; type: string; notes: string
}
export interface FollowUpSummary { total: number; pending: number; overdue: number; upcoming: FollowUp[] }
export const crmApi = {
  list: (query: Record<string, string | number | undefined>, signal?: AbortSignal) => request<Paginated<FollowUp> & { summary: FollowUpSummary }>('follow-ups/list.php', { query, signal }),
  create: (body: FollowUpPayload) => send<{id: number}>('follow-ups/create.php', {method: 'POST', body}),
  update: (id: number, body: Partial<FollowUpPayload> & {status: string}) => send<null>('follow-ups/update.php', {method: 'PUT', body: {id, ...body}}),
  save: (body: {record_id: number; priority: string; contact_status: string; assigned_to: number | null; next_action: string}) => send<null>('records/crm.php', {method: 'PUT', body}),
  activity: (record_id: number, type: string, description: string) => send<null>('activities/create.php', {method: 'POST', body: {record_id, type, description}}),
  timeline: (record_id: number, page: number, signal?: AbortSignal) => request<Paginated<ActivityEntry>>('activities/list.php', {query: {record_id, page, per_page: 10}, signal}),
}
export const interactionTypes = ['call', 'whatsapp', 'meeting', 'site_visit', 'email', 'other']
export const label = (value: string) => value === 'whatsapp' ? 'WhatsApp' : value.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
export const options = (values: string[]) => values.map(value => ({value, label: label(value)}))
