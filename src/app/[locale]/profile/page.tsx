import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { constructLocalizedMetadata, DEFAULT_KEYWORDS } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { ProfileDashboardUI } from "@/components/sections/ProfileDashboardUI";
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
    routeKey: "/profile",
    title: t("profileTitle"),
    description: t("profileDescription"),
    keywords: [
      "developer api",
      "api keys",
      "rest api access",
      "svg conversion api",
      "vector api",
      "background removal api",
      "conversion quota",
      ...DEFAULT_KEYWORDS,
    ],
  });
}

function renderHeroTitle(title: string) {
  const match = title.match(/(API Keys|Developer API|Claves de API|API-Schlüssel|Clés API|Chaves de API|APIキー)/i);
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

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tTools = await getTranslations({ locale, namespace: "tool_pages.developerApi" });

  return (
    <div className="w-full flex flex-col items-center">
      <Hero
        title={renderHeroTitle(tTools("h1"))}
        subtitle={tTools("subtitle")}
      />
      <ProfileDashboardUI />
    </div>
  );
}
