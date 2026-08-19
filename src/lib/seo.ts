import type { Metadata } from "next";

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://crush-svg.vercel.app";

interface SEOProps {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string;
  noindex?: boolean;
}

export function constructMetadata({
  title,
  description,
  canonicalPath,
  image = "/CrushSVG-logo.svg",
  noindex = false,
}: SEOProps): Metadata {
  const metadata: Metadata = {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalPath ? `${SITE_URL}${canonicalPath}` : undefined,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalPath ? `${SITE_URL}${canonicalPath}` : SITE_URL,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      siteName: "CrushSVG",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@CrushSVG",
    },
    icons: {
      icon: "/CrushSVG-logo.svg",
    },
  };

  if (noindex) {
    metadata.robots = {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    };
  }

  return metadata;
}

/**
 * Common Structured Data Components
 */

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CrushSVG",
    url: SITE_URL,
    logo: `${SITE_URL}/CrushSVG-logo.svg`,
    description: "Lightning-fast, precise SVG to PNG converter.",
    sameAs: [],
  };
}

export function getWebApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "CrushSVG",
    url: SITE_URL,
    description: "Paste your SVG code, upload a file, or drag and drop it. Generate crisp PNGs in seconds.",
    applicationCategory: "DesignApplication",
    operatingSystem: "All",
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
