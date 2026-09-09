import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { constructLocalizedMetadata, DEFAULT_KEYWORDS } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { ImageResizer } from "@/components/sections/ImageResizer";
import { Features } from "@/components/sections/Features";
import { SignUpCTA } from "@/components/sections/SignUpCTA";
import { StepsSection } from "@/components/sections/StepsSection";
import { FAQ } from "@/components/sections/FAQ";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SEO" });

  return constructLocalizedMetadata({
    locale,
    routeKey: "/image-resizer",
    title: t("imageResizerTitle"),
    description: t("imageResizerDescription"),
    keywords: DEFAULT_KEYWORDS,
  });
}

export default async function ImageResizerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tTools = await getTranslations({ locale, namespace: "tool_pages.imageResizer" });

  return (
    <div className="w-full flex flex-col items-center">
      <Hero
        title={tTools("h1")}
        subtitle={tTools("subtitle")}
      />
      <ImageResizer />
      <Features mode="image-resizer" />
      <SignUpCTA />
      <StepsSection mode="image-resizer" />
      <FAQ mode="image-resizer" />
    </div>
  );
}
