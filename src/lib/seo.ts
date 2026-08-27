import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://crushsvg.net").replace(/\/$/, "");

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
        { url: "/CrushSVG-logo.svg", type: "image/svg+xml" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
      other: [
        {
          rel: "mask-icon",
          url: "/CrushSVG-logo.svg",
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
    "name": "Crush SVG",
    "alternateName": "Crush SVG Converter",
    "url": "https://crushsvg.net/",
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
      url: `${SITE_URL}/CrushSVG-logo.svg`,
      width: 512,
      height: 512,
    },
    image: `${SITE_URL}/CrushSVG-logo.svg`,
    description: "Lightning-fast, precise SVG to PNG converter.",
    brand: {
      "@type": "Brand",
      name: "CrushSVG",
      logo: `${SITE_URL}/CrushSVG-logo.svg`,
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
