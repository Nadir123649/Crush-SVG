import "server-only";

/**
 * Server-side feature flag for the MODNet-based background removal engine.
 * Set BG_REMOVE_USE_MODNET=true to use MODNet; defaults to true.
 * When false, the legacy color-distance engine is used.
 */
export function shouldUseModnetEngine(): boolean {
  const val = process.env.BG_REMOVE_USE_MODNET;
  // Disable MODNet by default because it fails to initialize on many server environments.
  // We fall back to the legacy color-distance engine unless explicitly enabled.
  if (val === undefined || val === "") return false;
  return val === "true" || val === "1";
}
