import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["en", "es", "de", "fr", "pt", "ja"] as const,
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
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
  },
});

export type Locale = (typeof routing.locales)[number];
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

export const LOCALE_LABELS: Record<Locale, { name: string; nativeName: string; flag: string }> = {
  en: { name: "English", nativeName: "English", flag: "🇺🇸" },
  es: { name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  de: { name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  fr: { name: "French", nativeName: "Français", flag: "🇫🇷" },
  pt: { name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  ja: { name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
};
