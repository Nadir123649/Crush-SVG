import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { constructLocalizedMetadata, DEFAULT_KEYWORDS } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { ImageResizer } from "@/components/sections/ImageResizer";
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
    routeKey: "/image-resizer",
    title: t("imageResizerTitle"),
    description: t("imageResizerDescription"),
    keywords: DEFAULT_KEYWORDS,
  });
}

function renderHeroTitle(title: string) {
  const match = title.match(/(Images?|Bilder?|Imágenes?|Imagens?|画像)/i);
  if (!match) return title;
  const parts = title.split(match[0]);
  return (
    <>
      {parts[0]}
      <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">
        {match[0]}
      </span>
      {parts.slice(1).join(match[0])}
    </>
  );
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
    <div className="w-full min-w-0 max-w-full flex flex-col items-center">
      <Hero
        title={renderHeroTitle(tTools("h1"))}
        subtitle={tTools("subtitle")}
      />
      <ImageResizer />
      <Features mode="image-resizer" />
      <SignUpCTA />
      <StepsSection mode="image-resizer" />
      <AdBanner />
      <FAQ mode="image-resizer" />
    </div>
  );
}
