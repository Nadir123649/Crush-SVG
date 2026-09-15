import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { constructLocalizedMetadata, DEFAULT_KEYWORDS } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { FaviconGeneratorUI } from "@/components/sections/FaviconGeneratorUI";
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
    routeKey: "/favicon-generator",
    title: t("faviconGeneratorTitle"),
    description: t("faviconGeneratorDescription"),
    keywords: [
      "svg to favicon",
      "favicon generator",
      "svg to ico",
      "generate favicon pack",
      "apple touch icon generator",
      "favicon converter",
      "svg to webp",
      "android chrome icon generator",
      "webmanifest generator",
      ...DEFAULT_KEYWORDS,
    ],
  });
}

function renderHeroTitle(title: string) {
  const match = title.match(/(Favicon Generator|SVG to Favicon|ICO & WebP|Generador de Favicon|Favicon-Generator|Générateur de Favicon|Gerador de Favicon|ファビコン生成)/i);
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

export default async function FaviconGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tTools = await getTranslations({ locale, namespace: "tool_pages.faviconGenerator" });

  return (
    <div className="w-full flex flex-col items-center">
      <Hero
        title={renderHeroTitle(tTools("h1"))}
        subtitle={tTools("subtitle")}
      />
      <FaviconGeneratorUI />
      <Features mode="favicon-generator" />
      <SignUpCTA />
      <StepsSection mode="favicon-generator" />
      <AdBanner />
      <FAQ mode="favicon-generator" />
    </div>
  );
}
