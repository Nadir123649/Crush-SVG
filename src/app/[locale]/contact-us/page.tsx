import React from "react";
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { constructLocalizedMetadata, SITE_URL } from "@/lib/seo";
import { ContactUsClient } from "./ContactUsClient";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact_page" });

  return constructLocalizedMetadata({
    locale,
    routeKey: "/contact-us",
    title: t("metaTitle"),
    description: t("metaDesc"),
  });
}

export default async function ContactUsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${SITE_URL}/${locale === "en" ? "" : `${locale}/`}contact-us#webpage`,
    url: `${SITE_URL}/${locale === "en" ? "" : `${locale}/`}contact-us`,
    name: "Contact CrushSVG",
    mainEntity: {
      "@type": "Organization",
      name: "CrushSVG",
      email: "support@crushsvg.net",
      parentOrganization: { "@id": "https://thenevon.com/#organization" },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }} />
      <ContactUsClient />
    </>
  );
}
