import { apiFetch } from '@/lib/client/http'
import type { UsageInfo } from '@/lib/shared/shared-types'

export function getUsage(): Promise<UsageInfo> {
  return apiFetch<UsageInfo>('/api/v1/usage')
}