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
import { AdBanner } from "@/components/ui/AdBanner";
import { Link, routing } from "@/i18n/routing";

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
    routeKey: "/convert-svg-to-png",
    title: t("svgToPngTitle"),
    description: t("svgToPngDescription"),
    keywords: DEFAULT_KEYWORDS,
  });
}

export default async function ConvertSvgToPngPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tHome = await getTranslations({ locale, namespace: "homepage" });

  return (
    <div className="w-full flex flex-col items-center">
      <Hero />
      <ConverterUI mode="svg-to-png" />
      <Features mode="svg-to-png" />
      <SignUpCTA />

      {/* Background Remover CTA */}
      <section className="w-full flex justify-center mb-[60px] md:mb-[100px]">
        <div className="relative w-full max-w-[1100px] overflow-hidden bg-[#FAF6F3] border border-[#E8DED7] border-l-[4px] border-l-brand-primary rounded-[14px] p-[24px] md:p-[32px] flex flex-col md:grid md:grid-cols-[72px_1fr_auto] items-center md:items-start gap-[20px] md:gap-[24px]">
          <div className="w-[60px] h-[60px] rounded-[14px] bg-[#FFF1EB] border border-[#F0C9B9] flex items-center justify-center shrink-0">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-[30px] h-[30px]"
            >
              <path
                d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z"
                fill="#D94A1E"
              />
            </svg>
          </div>
          <div className="flex flex-col items-center md:items-start gap-[8px] text-center md:text-left">
            <h3 className="font-heading font-semibold text-[20px] md:text-[23px] leading-[26px] md:leading-[29px] text-text-dark">
              {tHome("bgRemoverCtaTitle")}{" "}
              <span className="text-[#DA582D]">{tHome("bgRemoverCtaHighlight")}</span>?
            </h3>
            <p className="max-w-[560px] font-body font-normal text-[14px] md:text-[15px] leading-[20px] text-text-muted">
              {tHome("bgRemoverCtaDesc")}
            </p>
          </div>
          <Link
            href="/background-remover"
            className="shrink-0 inline-flex items-center gap-[10px] justify-center h-[42px] md:h-[46px] px-[18px] md:px-[20px] rounded-[9px] bg-brand-primary font-heading font-medium text-[14px] md:text-[15px] text-white hover:bg-[#c4411a] transition-colors md:self-center"
          >
            {tHome("bgRemoverCtaButton")}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      <StepsSection mode="svg-to-png" />
      <TargetAudience mode="svg-to-png" />
      <AdBanner />
      <FAQ mode="svg-to-png" />
    </div>
  );
}
