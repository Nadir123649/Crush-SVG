import React from "react";
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link, routing } from "@/i18n/routing";
import { FAQ } from "@/components/sections/FAQ";
import { constructLocalizedMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { TechnicalComparisonTable } from "@/components/sections/TechnicalComparisonTable";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "help_page" });

  return constructLocalizedMetadata({
    locale,
    routeKey: "/help",
    title: t("metaTitle"),
    description: t("metaDesc"),
  });
}

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "help_page" });

  return (
    <div className="w-full flex flex-col items-center md:pb-[60px] min-h-[60vh]">
      {/* Header Section */}
      <Hero
        badge={t("badge")}
        title={<>{t("title").split(" ")[0]} <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">{t("title").split(" ").slice(1).join(" ") || "FAQ"}</span></>}
        subtitle={<>{t("subtitle")} <Link href="/svg-guides" className="text-brand-primary hover:underline font-medium">technical guides</Link>, or contact <Link href="/team" className="text-brand-primary hover:underline font-medium">our team</Link> directly.</>}
        className="mb-[24px] md:mb-[40px]"
      />

      <TechnicalComparisonTable />

      {/* Quick Resource Cards */}
      <div className="w-full max-w-[890px] grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Link
          href="/svg-guides"
          className="p-5 bg-white rounded-2xl border border-[#F2EDE8] hover:border-brand-primary transition-all flex flex-col justify-between group"
          style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}
        >
          <div>
            <h2 className="font-heading font-semibold text-base text-text-dark group-hover:text-brand-primary mb-1">
              {t("guidesCardTitle")}
            </h2>
            <p className="font-afacad text-sm text-text-muted">{t("guidesCardDesc")}</p>
          </div>
          <span className="text-xs font-semibold text-brand-primary mt-3 inline-block">{t("readGuides")}</span>
        </Link>

        <Link
          href="/support"
          className="p-5 bg-white rounded-2xl border border-[#F2EDE8] hover:border-brand-primary transition-all flex flex-col justify-between group"
          style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}
        >
          <div>
            <h2 className="font-heading font-semibold text-base text-text-dark group-hover:text-brand-primary mb-1">
              {t("supportCardTitle")}
            </h2>
            <p className="font-afacad text-sm text-text-muted">{t("supportCardDesc")}</p>
          </div>
          <span className="text-xs font-semibold text-brand-primary mt-3 inline-block">{t("viewSupport")}</span>
        </Link>

        <Link
          href="/"
          className="p-5 bg-white rounded-2xl border border-[#F2EDE8] hover:border-brand-primary transition-all flex flex-col justify-between group"
          style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}
        >
          <div>
            <h2 className="font-heading font-semibold text-base text-text-dark group-hover:text-brand-primary mb-1">
              {t("converterCardTitle")}
            </h2>
            <p className="font-afacad text-sm text-text-muted">{t("converterCardDesc")}</p>
          </div>
          <span className="text-xs font-semibold text-brand-primary mt-3 inline-block">{t("tryConverter")}</span>
        </Link>
      </div>

      {/* FAQ Section */}
      <div className="w-full">
        <FAQ />
      </div>

      {/* Contact Section */}
      <div className="w-full max-w-[890px] mt-[48px] md:mt-[64px] mb-[64px] md:mb-[80px] flex flex-col items-center bg-white rounded-[20px] p-[36px] md:p-[52px] border border-[#F2EDE8] shadow-[0_8px_30px_rgba(217,74,30,0.06)] relative overflow-hidden text-center"
      >
        <div className="w-12 h-12 rounded-full bg-[#FAF4EF] border border-brand-primary/20 flex items-center justify-center text-brand-primary mb-4 shadow-xs">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[12px]">
          Still have questions?
        </h2>
        <p className="font-afacad text-[16px] md:text-[18px] text-text-muted text-center mb-[24px] max-w-[500px]">
          If you couldn&apos;t find what you were looking for, our team at The Nevon is ready to assist you with any custom vector requirements.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            href="/contact-us"
            className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bricolage font-semibold text-[16px] py-[12px] px-[32px] rounded-[12px] hover:opacity-90 transition-opacity shadow-sm"
          >
            Contact Support Team
          </Link>
          <span className="font-afacad font-medium text-text-muted text-sm">
            or email{" "}
            <a
              href="mailto:support@crushsvg.net"
              className="text-brand-primary hover:underline font-semibold"
            >
              support@crushsvg.net
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
