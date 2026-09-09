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
  es: { name: "Spanish", nativeName: "Español", flag: "🇪🇸", region: "España / LatAm" },
  de: { name: "German", nativeName: "Deutsch", flag: "🇩🇪", region: "Deutschland" },
  fr: { name: "French", nativeName: "Français", flag: "🇫🇷", region: "France" },
  pt: { name: "Portuguese", nativeName: "Português", flag: "🇧🇷", region: "Brasil / Portugal" },
  ja: { name: "Japanese", nativeName: "日本語", flag: "🇯🇵", region: "日本" },
};
