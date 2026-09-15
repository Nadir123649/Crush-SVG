import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { constructLocalizedMetadata, DEFAULT_KEYWORDS } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { SvgOptimizerUI } from "@/components/sections/SvgOptimizerUI";
import { Features } from "@/components/sections/Features";
import { SignUpCTA } from "@/components/sections/SignUpCTA";
import { StepsSection } from "@/components/sections/StepsSection";
import { FAQ } from "@/components/sections/FAQ";
import { AdBanner } from "@/components/ui/AdBanner";
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
    routeKey: "/svg-optimizer",
    title: t("svgOptimizerTitle"),
    description: t("svgOptimizerDescription"),
    keywords: [
      "svg optimizer",
      "svg minifier",
      "compress svg",
      "svg compressor",
      "minify svg online",
      "clean svg code",
      "optimize svg online",
      "reduce svg file size",
      "svgo online",
      ...DEFAULT_KEYWORDS,
    ],
  });
}

function renderHeroTitle(title: string) {
  const match = title.match(/(Optimize SVG|Compress and Optimize|SVG Files|SVG optimieren|Optimizador SVG|Optimiser SVG)/i);
  if (!match) return title;

  const parts = title.split(match[0]);
  return (
    <>
      {parts[0]}
      <span className="text-brand-primary">{match[0]}</span>
      {parts.slice(1).join(match[0])}
    </>
  );
}

export default async function SvgOptimizerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tTools = await getTranslations({ locale, namespace: "tool_pages.svgOptimizer" });

  return (
    <div className="w-full flex flex-col items-center">
      <Hero
        title={renderHeroTitle(tTools("h1"))}
        subtitle={tTools("subtitle")}
      />
      <SvgOptimizerUI />
      <Features mode="svg-optimizer" />
      <SignUpCTA />
      <StepsSection mode="svg-optimizer" />
      <AdBanner />
      <FAQ mode="svg-optimizer" />
    </div>
  );
}
