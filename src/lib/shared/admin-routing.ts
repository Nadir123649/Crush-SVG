/** Return the unlocalized admin route for supported locale-prefixed paths. */
export function getCanonicalAdminPathname(
  pathname: string,
  locales: readonly string[]
): string | null {
  const match = pathname.match(/^\/([^/]+)(\/admin(?:\/.*)?)$/)

  if (!match || !locales.includes(match[1])) return null

  return match[2]
}
