import type { ComponentProps, ComponentType } from "react";
import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["en", "es", "de", "fr", "pt", "ja"] as const,
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: true,
  pathnames: {
    "/": "/",
    "/convert-svg-to-png": {
      en: "/convert-svg-to-png",
      es: "/convertir-svg-a-png",
      de: "/svg-in-png-umwandeln",
      fr: "/convertir-svg-en-png",
      pt: "/converter-svg-para-png",
      ja: "/svg-png-henkan",
    },
    "/png-to-svg": {
      en: "/png-to-svg",
      es: "/convertir-png-a-svg",
      de: "/png-in-svg-umwandeln",
      fr: "/convertir-png-en-svg",
      pt: "/converter-png-para-svg",
      ja: "/png-svg-henkan",
    },
    "/background-remover": {
      en: "/background-remover",
      es: "/eliminar-fondo",
      de: "/hintergrund-entfernen",
      fr: "/supprimer-arriere-plan",
      pt: "/remover-fundo",
      ja: "/haikei-touka",
    },
    "/image-resizer": {
      en: "/image-resizer",
      es: "/redimensionar-imagen",
      de: "/bildgrossen-andern",
      fr: "/redimensionner-image",
      pt: "/redimensionar-imagem",
      ja: "/gazou-saizu-henkou",
    },
    "/svg-optimizer": {
      en: "/svg-optimizer",
      es: "/optimizador-svg",
      de: "/svg-optimierer",
      fr: "/optimiseur-svg",
      pt: "/otimizador-svg",
      ja: "/svg-saitekika",
    },
  },
});

export type Locale = (typeof routing.locales)[number];
const navigation = createNavigation(routing);
export const redirect = navigation.redirect;
export const usePathname = navigation.usePathname;
export const useRouter = navigation.useRouter;
export const getPathname = navigation.getPathname;

export const Link = navigation.Link as unknown as ComponentType<
  Omit<ComponentProps<typeof navigation.Link>, "href"> & {
    href: string | { pathname: string; query?: Record<string, any> };
    locale?: Locale;
  }
>;

export const LOCALE_LABELS: Record<Locale, { name: string; nativeName: string; flag: string; region: string }> = {
  en: { name: "English", nativeName: "English", flag: "🇺🇸", region: "Global" },
  es: { name: "Spanish", nativeName: "Español", flag: "🇪🇸", region: "Spain & Latin America" },
  de: { name: "German", nativeName: "Deutsch", flag: "🇩🇪", region: "Germany" },
  fr: { name: "French", nativeName: "Français", flag: "🇫🇷", region: "France" },
  pt: { name: "Portuguese", nativeName: "Português", flag: "🇧🇷", region: "Brazil & Portugal" },
  ja: { name: "Japanese", nativeName: "日本語", flag: "🇯🇵", region: "Japan" },
};

// Bidirectional lookup map: translated slug -> canonical route key
const SLUG_TO_CANONICAL: Record<string, string> = {};
const PATHNAME_CONFIG = routing.pathnames as unknown as Record<string, Record<Locale, string> | string>;

for (const [canonicalKey, translations] of Object.entries(PATHNAME_CONFIG)) {
  if (typeof translations === "string") {
    SLUG_TO_CANONICAL[translations] = canonicalKey;
  } else if (typeof translations === "object" && translations !== null) {
    for (const slug of Object.values(translations)) {
      SLUG_TO_CANONICAL[slug as string] = canonicalKey;
    }
  }
}

/**
 * Resolves any current URL pathname to the correct localized target URL.
 * Handles bidirectional slug translations, default locale prefix stripping,
 * query parameters, and hash anchors without throwing or 404s.
 */
export function getLocalizedHref(rawPath: string, targetLocale: Locale): string {
  if (!rawPath) return targetLocale === routing.defaultLocale ? "/" : `/${targetLocale}`;

  // Split query/hash if present
  let pathOnly = rawPath;
  let queryAndHash = "";
  const queryIndex = rawPath.search(/[?#]/);
  if (queryIndex !== -1) {
    pathOnly = rawPath.slice(0, queryIndex);
    queryAndHash = rawPath.slice(queryIndex);
  }

  // Strip leading locale prefix (e.g., /es/convertir-png-a-svg -> /convertir-png-a-svg)
  const localePattern = new RegExp(`^\\/(${routing.locales.join("|")})(\\/|$)`);
  const cleanPath = pathOnly.replace(localePattern, "/");
  const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;

  // Find canonical key
  const canonicalKey = SLUG_TO_CANONICAL[normalizedPath] || normalizedPath;
  const routeTranslations = PATHNAME_CONFIG[canonicalKey];

  let targetPath = canonicalKey;
  if (typeof routeTranslations === "string") {
    targetPath = routeTranslations;
  } else if (typeof routeTranslations === "object" && routeTranslations !== null) {
    targetPath = routeTranslations[targetLocale] || canonicalKey;
  }

  // Clean trailing slashes (except root "/")
  if (targetPath.length > 1 && targetPath.endsWith("/")) {
    targetPath = targetPath.slice(0, -1);
  }

  // Prefix locale if not default locale
  let finalPath = targetPath;
  if (targetLocale === routing.defaultLocale) {
    finalPath = targetPath || "/";
  } else {
    finalPath = targetPath === "/" ? `/${targetLocale}` : `/${targetLocale}${targetPath.startsWith("/") ? targetPath : `/${targetPath}`}`;
  }

  return `${finalPath}${queryAndHash}`;
}
