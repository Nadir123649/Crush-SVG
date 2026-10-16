// Swagger UI page. It lives outside [locale] (not translated), so links and
// the proxy must use this exact path — never a locale-prefixed variant.
export const API_DOCS_PATH = "/api-docs";

const API_DOCS_ALIASES = new Set(["/docs", API_DOCS_PATH, "/swagger"]);

export function getApiFrontendOrigin(apiHostname: string): string {
  return apiHostname.startsWith("staging.")
    ? "https://staging.crushsvg.net"
    : "https://www.crushsvg.net";
}

export function getApiDocsRedirect(
  pathname: string,
  method: string,
  apiHostname: string,
): URL | null {
  if (!API_DOCS_ALIASES.has(pathname) || !["GET", "HEAD"].includes(method.toUpperCase())) {
    return null;
  }

  return new URL(API_DOCS_PATH, getApiFrontendOrigin(apiHostname));
}
