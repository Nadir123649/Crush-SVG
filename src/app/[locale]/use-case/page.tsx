import React from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { constructLocalizedMetadata, SITE_URL, getBreadcrumbSchema } from "@/lib/seo";
import { useCases, useCaseCategories } from "@/lib/data/use-cases";
import { ALL_CATEGORIES } from "@/lib/data/use-case-filter";
import { Hero } from "@/components/sections/Hero";
import { UseCaseListing } from "@/components/use-case/UseCaseListing";
import { AdBanner } from "@/components/ui/AdBanner";

const META_TITLE = "SVG Converter Use Cases | CrushSVG";
const META_DESC =
  "Explore how people use CrushSVG: convert SVG to PNG for React, email signatures, Canva, Cricut, Shopify, WordPress and more.";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return constructLocalizedMetadata({
    locale,
    routeKey: "/use-case",
    title: META_TITLE,
    description: META_DESC,
    keywords: [
      "svg to png use cases",
      "svg converter for react",
      "svg to png for email",
      "svg to png for canva",
      "crushsvg use cases",
    ],
  });
}

export default async function UseCaseIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const prefix = locale === "en" ? "" : `/${locale}`;

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: META_TITLE,
    description: META_DESC,
    url: `${SITE_URL}${prefix}/use-case`,
    isPartOf: { "@type": "WebSite", name: "CrushSVG", url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: useCases.map((uc, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: uc.title,
        url: `${SITE_URL}${prefix}/use-case/${uc.slug}`,
      })),
    },
  };

  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", item: prefix },
    { name: "Use Cases", item: `${prefix}/use-case` },
  ]);

  return (
    <main className="w-full flex flex-col items-center min-h-[70vh] bg-background pb-[60px] md:pb-[100px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <Hero
        badge="CrushSVG Use Cases"
        title={
          <>
            Built for Every Workflow,{" "}
            <span className="text-brand-primary">Ready in Seconds</span>
          </>
        }
        subtitle="See how designers, developers and store owners use CrushSVG to convert, optimize and prepare vector graphics for the tools they work in."
        className="mb-6 md:mb-10"
      />

      <UseCaseListing useCases={useCases} categories={[ALL_CATEGORIES, ...useCaseCategories]} />

      <AdBanner />
    </main>
  );
}
