import { apiFetch } from '@/lib/client/http'
import type { UsageInfo } from '@/lib/shared/shared-types'

export function getUsage(): Promise<UsageInfo> {
  return apiFetch<UsageInfo>('/api/v1/usage').then(usage => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('crush_usage_info', JSON.stringify(usage));
    }
    return usage;
  });
}