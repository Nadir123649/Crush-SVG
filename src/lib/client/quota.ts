import type { UsageInfo } from "@/lib/shared/shared-types";
import { getUsage } from "@/lib/client/sessions";

/**
 * Shared client-side interpretation of the server's conversion-quota response.
 *
 * `/api/v1/usage` is the only source of truth for `limit`, `remaining` and
 * `isUnlimited`. Nothing here infers entitlement from the auth status, so a
 * signed-in user can never be shown "Unlimited" unless the server said so.
 */
export type QuotaDisplay =
  | { kind: "blank" }
  | { kind: "unlimited" }
  | { kind: "counted"; used: number; total: number };

export function resolveQuotaDisplay(usage: UsageInfo | null): QuotaDisplay {
  if (!usage) return { kind: "blank" };
  if (usage.isUnlimited) return { kind: "unlimited" };

  if (typeof usage.limit === "number") {
    return { kind: "counted", used: usage.conversionsUsed, total: usage.limit };
  }

  // Fallback for payloads persisted before `limit` existed (e.g. a cached
  // `crush_usage_info` entry), where `remaining` still identifies the total.
  if (typeof usage.remaining === "number") {
    return { kind: "counted", used: usage.conversionsUsed, total: usage.conversionsUsed + usage.remaining };
  }

  return { kind: "blank" };
}

/** True when the caller is out of conversions and must be refused. */
export function hasQuotaLimitReached(usage: UsageInfo | null): boolean {
  if (!usage || usage.isUnlimited) return false;
  if (typeof usage.limit === "number") return usage.conversionsUsed >= usage.limit;
  return usage.limitReached === true;
}

/**
 * Re-reads the authoritative usage after a conversion and notifies the rest of
 * the app through the existing `crushUsageUpdated` event, so the counter
 * updates without a page reload. Keeps the previous value if the request
 * fails.
 */
export async function refreshUsage(
  setUsage: (usage: UsageInfo) => void,
  setUsageFailed?: (failed: boolean) => void,
): Promise<void> {
  try {
    const usage = await getUsage();
    setUsage(usage);
    setUsageFailed?.(false);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("crush_usage_info", JSON.stringify(usage));
      } catch {}
      window.dispatchEvent(new CustomEvent("crushUsageUpdated", { detail: usage }));
    }
  } catch {
    /* keep the last known value */
  }
}