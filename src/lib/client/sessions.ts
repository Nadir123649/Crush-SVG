import { apiFetch } from '@/lib/client/http'
import type { UsageInfo } from '@/lib/shared/shared-types'

const GUEST_LIMIT = 3;

export function getLocalGuestUsage(): UsageInfo {
  if (typeof window === "undefined") {
    return { conversionsUsed: 0, limit: GUEST_LIMIT, remaining: GUEST_LIMIT, isUnlimited: false, limitReached: false };
  }
  try {
    const raw = localStorage.getItem("crush_guest_conversion_usage");
    if (raw) {
      const parsed = JSON.parse(raw);
      const used = typeof parsed.used === "number" ? parsed.used : 0;
      const limit = typeof parsed.limit === "number" ? parsed.limit : GUEST_LIMIT;
      return {
        conversionsUsed: used,
        limit,
        remaining: Math.max(0, limit - used),
        isUnlimited: false,
        limitReached: used >= limit,
      };
    }
  } catch {}
  return { conversionsUsed: 0, limit: GUEST_LIMIT, remaining: GUEST_LIMIT, isUnlimited: false, limitReached: false };
}

export function incrementLocalGuestUsage(): UsageInfo {
  const current = getLocalGuestUsage();
  const nextUsed = Math.min(current.limit ?? GUEST_LIMIT, current.conversionsUsed + 1);
  const updated: UsageInfo = {
    conversionsUsed: nextUsed,
    limit: current.limit ?? GUEST_LIMIT,
    remaining: Math.max(0, (current.limit ?? GUEST_LIMIT) - nextUsed),
    isUnlimited: false,
    limitReached: nextUsed >= (current.limit ?? GUEST_LIMIT),
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("crush_guest_conversion_usage", JSON.stringify({
        used: updated.conversionsUsed,
        limit: updated.limit,
        savedAt: Date.now(),
      }));
      localStorage.setItem("crush_usage_info", JSON.stringify(updated));
    } catch {}
    window.dispatchEvent(new CustomEvent("crushUsageUpdated", { detail: updated }));
  }
  return updated;
}

export function getUsage(): Promise<UsageInfo> {
  return apiFetch<UsageInfo>('/api/v1/usage')
    .then(usage => {
      if (typeof window !== 'undefined' && usage && typeof usage.limit === 'number') {
        try {
          localStorage.setItem('crush_guest_conversion_usage', JSON.stringify({
            used: usage.conversionsUsed,
            limit: usage.limit,
            savedAt: Date.now()
          }));
        } catch {}
      }
      return usage;
    })
    .catch(() => {
      return getLocalGuestUsage();
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
      try {
        localStorage.setItem('crush_usage_info', JSON.stringify(usage));
        if (typeof usage.limit === 'number') {
          localStorage.setItem('crush_guest_conversion_usage', JSON.stringify({
            used: usage.conversionsUsed,
            limit: usage.limit,
            savedAt: Date.now()
          }));
        }
      } catch {
        // Usage still updates in memory when browser storage is unavailable.
      }
      window.dispatchEvent(new CustomEvent('crushUsageUpdated', { detail: usage }));
    }
    return usage;
  }).catch((err) => {
    if (typeof window !== 'undefined' && metadata.success !== false) {
      const local = incrementLocalGuestUsage();
      return local;
    }
    throw err;
  });
}
