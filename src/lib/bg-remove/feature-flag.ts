import "server-only";

/**
 * Server-side feature flag for the MODNet-based background removal engine.
 * MODNet is enabled by default for photographic inputs. Set
 * BG_REMOVE_USE_MODNET=false to force the legacy color-distance engine.
 */
export function shouldUseModnetEngine(): boolean {
  const val = process.env.BG_REMOVE_USE_MODNET;
  // Match the documented default: photos use the AI model unless an operator
  // explicitly disables it for an environment where inference is unavailable.
  if (val === undefined || val.trim() === "") return true;
  return val === "true" || val === "1";
}
