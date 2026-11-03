import { getLocalizedHref, routing, type Locale } from "@/i18n/routing";

export const SITEMAP_INDEXABLE_STATIC_ROUTES = new Set([
  "/",
  "/about",
  "/background-remover",
  "/blog",
  "/compare/crushsvg-vs-vectorizer-ai",
  "/favicon-generator",
  "/help",
  "/image-resizer",
  "/png-to-svg",
  "/svg-guides",
  "/svg-optimizer",
  "/svg-to-react",
  "/use-case",
]);

export function getSitemapLanguageAlternates(
  path: string,
  baseUrl: string,
): Record<Locale | "x-default", string> {
  const languages = routing.locales.reduce<Record<Locale, string>>(
    (alternates, locale) => {
      alternates[locale] = `${baseUrl}${getLocalizedHref(path, locale)}`;
      return alternates;
    },
    {} as Record<Locale, string>,
  );

  return {
    ...languages,
    "x-default": languages[routing.defaultLocale],
  };
}
