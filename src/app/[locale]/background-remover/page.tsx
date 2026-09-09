import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { constructLocalizedMetadata, DEFAULT_KEYWORDS } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { BackgroundRemover } from "@/components/sections/BackgroundRemover";
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
    routeKey: "/background-remover",
    title: t("bgRemoverTitle"),
    description: t("bgRemoverDescription"),
    keywords: DEFAULT_KEYWORDS,
  });
}

export default async function BackgroundRemoverPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tTools = await getTranslations({ locale, namespace: "tool_pages.backgroundRemover" });

  return (
    <div className="w-full flex flex-col items-center">
      <Hero
        title={tTools("h1")}
        subtitle={tTools("subtitle")}
      />
      <BackgroundRemover />
      <Features mode="background-remover" />
      <SignUpCTA />
      <StepsSection mode="background-remover" />
      <FAQ mode="background-remover" />
    </div>
  );
}
