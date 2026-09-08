import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://www.crushsvg.net").replace(/\/$/, "");

export const DEFAULT_KEYWORDS = [
  "crush svg",
  "crushsvg",
  "crush svg converter",
  "svg to png",
  "convert svg to png",
  "svg to png converter",
  "svg converter",
  "svg to image",
  "svg to high res png",
  "free svg converter",
  "online svg converter",
  "vector to png",
  "export svg to png",
  "svg optimizer",
  "svg rasterizer",
  "svg to png transparent",
];

interface SEOProps {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string;
  keywords?: string[];
  noindex?: boolean;
}

export const OG_LOCALES: Record<string, string> = {
  en: "en_US",
  es: "es_ES",
  de: "de_DE",
  fr: "fr_FR",
  pt: "pt_BR",
  ja: "ja_JP",
};

export const LOCALIZED_ROUTE_MAP: Record<string, Record<string, string>> = {
  "/": {
    en: "/",
    es: "/es",
    de: "/de",
    fr: "/fr",
    pt: "/pt",
    ja: "/ja",
  },
  "/convert-svg-to-png": {
    en: "/convert-svg-to-png",
    es: "/es/convertir-svg-a-png",
    de: "/de/svg-in-png-umwandeln",
    fr: "/fr/convertir-svg-en-png",
    pt: "/pt/converter-svg-para-png",
    ja: "/ja/svg-png-henkan",
  },
  "/png-to-svg": {
    en: "/png-to-svg",
    es: "/es/convertir-png-a-svg",
    de: "/de/png-in-svg-umwandeln",
    fr: "/fr/convertir-png-en-svg",
    pt: "/pt/converter-png-para-svg",
    ja: "/ja/png-svg-henkan",
  },
  "/background-remover": {
    en: "/background-remover",
    es: "/es/eliminar-fondo",
    de: "/de/hintergrund-entfernen",
    fr: "/fr/supprimer-arriere-plan",
    pt: "/pt/remover-fundo",
    ja: "/ja/haikei-touka",
  },
  "/image-resizer": {
    en: "/image-resizer",
    es: "/es/redimensionar-imagen",
    de: "/de/bildgrossen-andern",
    fr: "/fr/redimensionner-image",
    pt: "/pt/redimensionar-imagem",
    ja: "/ja/gazou-saizu-henkou",
  },
};

interface LocalizedSEOProps {
  locale: string;
  routeKey: keyof typeof LOCALIZED_ROUTE_MAP;
  title: string;
  description: string;
  image?: string;
  keywords?: string[];
  noindex?: boolean;
}

export function constructLocalizedMetadata({
  locale,
  routeKey,
  title,
  description,
  image = "/opengraph-image",
  keywords = DEFAULT_KEYWORDS,
  noindex = false,
}: LocalizedSEOProps): Metadata {
  const routeMapping = LOCALIZED_ROUTE_MAP[routeKey] || { [locale]: routeKey };
  const currentPath = routeMapping[locale] || routeKey;
  const canonicalUrl = `${SITE_URL}${currentPath === "/" ? "" : currentPath}`;

  const languages: Record<string, string> = {};
  for (const [loc, path] of Object.entries(routeMapping)) {
    languages[loc] = `${SITE_URL}${path === "/" ? "" : path}`;
  }
  if (routeMapping.en) {
    languages["x-default"] = `${SITE_URL}${routeMapping.en === "/" ? "" : routeMapping.en}`;
  }

  const ogLocale = OG_LOCALES[locale] || "en_US";

  return {
    title,
    description,
    keywords,
    applicationName: "CrushSVG",
    authors: [{ name: "CrushSVG Team", url: SITE_URL }],
    creator: "CrushSVG",
    publisher: "CrushSVG",
    category: "Developer & Designer Tools",
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl,
      siteName: "CrushSVG",
      locale: ogLocale,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@CrushSVG",
      site: "@CrushSVG",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "CrushSVG",
    },
    formatDetection: {
      telephone: false,
      date: false,
      address: false,
      email: false,
      url: false,
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "32x32" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
      other: [
        {
          rel: "mask-icon",
          url: "/icon-512.png",
          color: "#D94A1E",
        },
      ],
    },
    manifest: "/manifest.webmanifest",
    robots: noindex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : {
          index: true,
          follow: true,
          nocache: false,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "4g9Z_Bp03i6CKz3fw8qNFHYNDOfQM-Pgk9V4iGpX-cg",
      other: {
        "msvalidate.01": ["68434D213B77FA63AE8FFAA76729DCEE"],
      },
    },
  };
}

export function constructMetadata({
  title,
  description,
  canonicalPath,
  image = "/opengraph-image",
  keywords = DEFAULT_KEYWORDS,
  noindex = false,
}: SEOProps): Metadata {
  const url = canonicalPath ? `${SITE_URL}${canonicalPath}` : SITE_URL;

  const metadata: Metadata = {
    title,
    description,
    keywords,
    applicationName: "CrushSVG",
    authors: [{ name: "CrushSVG Team", url: SITE_URL }],
    creator: "CrushSVG",
    publisher: "CrushSVG",
    category: "Developer & Designer Tools",
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: "CrushSVG",
      locale: "en_US",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@CrushSVG",
      site: "@CrushSVG",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "CrushSVG",
    },
    formatDetection: {
      telephone: false,
      date: false,
      address: false,
      email: false,
      url: false,
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "32x32" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
      other: [
        {
          rel: "mask-icon",
          url: "/icon-512.png",
          color: "#D94A1E",
        },
      ],
    },
    manifest: "/manifest.webmanifest",
    robots: noindex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : {
          index: true,
          follow: true,
          nocache: false,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "4g9Z_Bp03i6CKz3fw8qNFHYNDOfQM-Pgk9V4iGpX-cg",
      other: {
        "msvalidate.01": ["68434D213B77FA63AE8FFAA76729DCEE"],
      },
    },
  };

  return metadata;
}

/**
 * Common Structured Data Components (JSON-LD)
 */

export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    "name": "CrushSVG",
    "alternateName": "CrushSVG Converter",
    "url": SITE_URL,
  };
}

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "CrushSVG",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/icon-512.png`,
      width: 512,
      height: 512,
    },
    image: `${SITE_URL}/icon-512.png`,
    description: "Lightning-fast, precise SVG to PNG converter.",
    brand: {
      "@type": "Brand",
      name: "CrushSVG",
      logo: `${SITE_URL}/icon-512.png`,
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@crushsvg.net",
      contactType: "customer support",
    },
    parentOrganization: {
      "@type": "Organization",
      name: "The Nevon",
      url: "https://www.thenevon.com",
    },
    sameAs: [
      "https://www.thenevon.com",
    ],
  };
}

export function getWebApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "CrushSVG",
    alternateName: "Crush SVG Converter",
    url: SITE_URL,
    description: "Paste your SVG code, upload a file, or drag and drop it. Generate crisp PNGs in seconds.",
    applicationCategory: "DesignApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function getBreadcrumbSchema(items: { name: string; item: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((breadcrumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: breadcrumb.name,
      item: `${SITE_URL}${breadcrumb.item}`,
    })),
  };
}

export function getFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function getHowToSchema(name: string, description: string, steps: { name: string; text: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    step: steps.map((step, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

export function getArticleSchema(article: { title: string; description: string; slug: string; date: string; author?: string; image?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    url: `${SITE_URL}/blog/${article.slug}`,
    datePublished: article.date,
    dateModified: article.date,
    author: {
      "@type": "Organization",
      name: article.author || "CrushSVG Team",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "CrushSVG",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon-512.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${article.slug}`,
    },
    image: article.image || `${SITE_URL}/opengraph-image`,
  };
}

