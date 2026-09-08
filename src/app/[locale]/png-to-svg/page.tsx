import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { constructLocalizedMetadata, DEFAULT_KEYWORDS } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { ConverterUI } from "@/components/sections/ConverterUI";
import { Features } from "@/components/sections/Features";
import { SignUpCTA } from "@/components/sections/SignUpCTA";
import { StepsSection } from "@/components/sections/StepsSection";
import { TargetAudience } from "@/components/sections/TargetAudience";
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
    routeKey: "/png-to-svg",
    title: t("pngToSvgTitle"),
    description: t("pngToSvgDescription"),
    keywords: DEFAULT_KEYWORDS,
  });
}

export default async function PngToSvgPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tTools = await getTranslations({ locale, namespace: "tool_pages.pngToSvg" });

  return (
    <div className="w-full flex flex-col items-center">
      <Hero
        title={tTools("h1")}
        subtitle={tTools("subtitle")}
      />
      <ConverterUI mode="raster-to-svg" />
      <Features mode="raster-to-svg" />
      <SignUpCTA />
      <StepsSection mode="raster-to-svg" />
      <TargetAudience mode="raster-to-svg" />
      <FAQ mode="raster-to-svg" />
    </div>
  );
}
