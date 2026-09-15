import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { constructLocalizedMetadata, DEFAULT_KEYWORDS } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { SvgToCodeUI } from "@/components/sections/SvgToCodeUI";
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
    routeKey: "/svg-to-react",
    title: t("svgToReactTitle"),
    description: t("svgToReactDescription"),
    keywords: [
      "svg to react",
      "svg to jsx",
      "svg to tsx",
      "svgr online",
      "svg to vue",
      "svg to svelte",
      "svg to react native",
      "convert svg to react component",
      "svg component generator",
      "online svg to tsx converter",
      ...DEFAULT_KEYWORDS,
    ],
  });
}

function renderHeroTitle(title: string) {
  const match = title.match(/(React & Vue Components|React & JSX|React-Komponenten|Componentes React|Composants React|React コンポーネント)/i);
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

export default async function SvgToReactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tTools = await getTranslations({ locale, namespace: "tool_pages.svgToReact" });

  return (
    <div className="w-full flex flex-col items-center">
      <Hero
        title={renderHeroTitle(tTools("h1"))}
        subtitle={tTools("subtitle")}
      />
      <SvgToCodeUI />
      <Features mode="svg-to-react" />
      <SignUpCTA />
      <StepsSection mode="svg-to-react" />
      <AdBanner />
      <FAQ mode="svg-to-react" />
    </div>
  );
}