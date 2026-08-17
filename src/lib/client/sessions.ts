import { apiFetch } from '@/lib/client/http'
import type { SessionDTO, UsageInfo } from '@/lib/shared-types'

export interface SessionListResponse {
  sessions: SessionDTO[]
  meta: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}

export function listSessions(): Promise<SessionListResponse> {
  return apiFetch<SessionListResponse>('/api/v1/sessions')
}

export function revokeSession(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function revokeAllSessions(): Promise<void> {
  return apiFetch<void>('/api/v1/sessions', { method: 'DELETE' })
}

export function getUsage(): Promise<UsageInfo> {
  return apiFetch<UsageInfo>('/api/v1/usage')
}
