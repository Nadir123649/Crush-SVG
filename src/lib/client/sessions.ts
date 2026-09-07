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

export function trackConversionUsage(metadata: {
  inputFormat: string;
  outputFormat: string;
  originalSize?: number;
  success: boolean;
  errorReason?: string;
}): Promise<UsageInfo> {
  return apiFetch<UsageInfo>('/api/v1/usage', {
    method: 'POST',
    body: JSON.stringify({ metadata })
  }).then(usage => {
    if (typeof window !== 'undefined' && usage) {
      localStorage.setItem('crush_usage_info', JSON.stringify(usage));
    }
    return usage;
  });
}