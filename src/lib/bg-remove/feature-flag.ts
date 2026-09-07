import "server-only";

/**
 * Server-side feature flag for the MODNet-based background removal engine.
 * Set BG_REMOVE_USE_MODNET=true to use MODNet; defaults to true.
 * When false, the legacy color-distance engine is used.
 */
export function shouldUseModnetEngine(): boolean {
  const val = process.env.BG_REMOVE_USE_MODNET;
  if (val === undefined || val === "") return true;
  return val === "true" || val === "1";
}
