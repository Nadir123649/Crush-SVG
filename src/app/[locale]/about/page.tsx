import React from "react";
import Image from "next/image";
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link, routing } from "@/i18n/routing";
import { IMAGES } from "@/lib/shared/images";
import { constructLocalizedMetadata, SITE_URL } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about_page" });

  return constructLocalizedMetadata({
    locale,
    routeKey: "/about",
    title: t("metaTitle"),
    description: t("metaDesc"),
  });
}

export default async function AboutUsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about_page" });

  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${SITE_URL}/about#webpage`,
    name: t("metaTitle"),
    url: `${SITE_URL}${locale === "en" ? "/about" : `/${locale}/about`}`,
    description: t("metaDesc"),
    publisher: {
      "@type": "Organization",
      name: "The Nevon",
      url: "https://www.thenevon.com",
    },
    isPartOf: {
      "@type": "WebSite",
      name: "CrushSVG",
      url: SITE_URL,
    },
  };

  const teamMembers = [
    {
      name: "Sardar Muhammad Nadir",
      role: "CEO and Founder",
      bio: "Visionary entrepreneur and tech leader driving the strategic direction of The Nevon. Nadir is focused on building high-impact SaaS products and scaling teams.",
      initials: "SN",
      linkedin: "https://www.linkedin.com/in/nadir1214/",
    },
    {
      name: "Muhammad Aswad Khan",
      role: "Project Manager",
      bio: "Dedicated project manager bridging the gap between design, engineering, and business goals. Aswad oversees Agile workflows and ensures timely, high-quality delivery.",
      initials: "AK",
      linkedin: "https://www.linkedin.com/in/muhammad-aswad-khan/",
    },
  ];

  return (
    <div className="w-full flex flex-col items-center md:pb-[60px] min-h-[60vh]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />

      {/* Hero Section */}
      <Hero
        badge={t("badge")}
        title={<>{t("titlePrefix")} <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">{t("titleHighlight")}</span></>}
        subtitle={t("subtitle")}
        className="mb-[24px] md:mb-[60px]"
      />

      {/* Content Sections */}
      <div className="w-full max-w-[800px] flex flex-col gap-[32px] md:gap-[48px]">
        
        {/* Our Mission */}
        <div className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            {t("missionTitle")}
          </h2>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6] mb-4">
            {t("missionP1")}
          </p>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">
            {t("missionP2")}
          </p>
        </div>

        {/* Built by The Nevon */}
        <div className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-[16px]">
            <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark">
              {t("nevonTitle")}
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#F8F5F2] text-text-muted">{t("nevonBadge")}</span>
          </div>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6] mb-4">
            {t("nevonP1")}
          </p>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">
            {t("nevonP2")}
          </p>
        </div>

        {/* What Makes CrushSVG Different */}
        <div className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[24px]">
            {t("diffTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-[12px] bg-[#FCFBF9] border border-[#F2EDE8]">
              <h3 className="font-heading font-semibold text-text-dark text-lg mb-2">{t("diff1Title")}</h3>
              <p className="font-afacad text-sm text-text-muted leading-relaxed">{t("diff1Desc")}</p>
            </div>
            <div className="p-5 rounded-[12px] bg-[#FCFBF9] border border-[#F2EDE8]">
              <h3 className="font-heading font-semibold text-text-dark text-lg mb-2">{t("diff2Title")}</h3>
              <p className="font-afacad text-sm text-text-muted leading-relaxed">{t("diff2Desc")}</p>
            </div>
            <div className="p-5 rounded-[12px] bg-[#FCFBF9] border border-[#F2EDE8]">
              <h3 className="font-heading font-semibold text-text-dark text-lg mb-2">{t("diff3Title")}</h3>
              <p className="font-afacad text-sm text-text-muted leading-relaxed">{t("diff3Desc")}</p>
            </div>
            <div className="p-5 rounded-[12px] bg-[#FCFBF9] border border-[#F2EDE8]">
              <h3 className="font-heading font-semibold text-text-dark text-lg mb-2">{t("diff4Title")}</h3>
              <p className="font-afacad text-sm text-text-muted leading-relaxed">{t("diff4Desc")}</p>
            </div>
          </div>
        </div>

        {/* Leadership & Direction */}
        <div className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-[24px]">
            <div>
              <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark">
                {t("leadershipTitle")}
              </h2>
              <p className="font-afacad text-sm text-text-muted mt-1">{t("leadershipSubtitle")}</p>
            </div>
            <Link href="/team" className="text-sm font-semibold text-brand-primary hover:underline">
              View Full Team &rarr;
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamMembers.map((member) => (
              <a
                key={member.name}
                href={member.linkedin || "#"}
                target={member.linkedin ? "_blank" : undefined}
                rel={member.linkedin ? "noopener noreferrer" : undefined}
                className="flex flex-col p-5 rounded-[12px] bg-[#FCFBF9] border border-[#F2EDE8] group cursor-pointer hover:border-brand-primary/20 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary text-white font-heading font-semibold flex items-center justify-center text-lg shadow-sm flex-shrink-0">
                    {member.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-heading font-semibold text-text-dark text-base md:text-lg truncate">
                        {member.name.replace("Muhammad ", "M. ")}
                      </h3>
                      {member.linkedin && (
                        <div className="opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <Image src={IMAGES.linkedin} alt="LinkedIn" width={20} height={20} className="w-[20px] h-[20px] object-contain" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs md:text-sm font-medium text-brand-primary">{member.role}</p>
                  </div>
                </div>
                <p className="font-afacad text-sm text-text-muted leading-relaxed">{member.bio}</p>
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* CTA Section */}
      <div className="w-full max-w-[800px] flex flex-col items-center text-center mt-[48px] md:mt-[60px] p-[32px] md:p-[48px] bg-[#FCF1ED] rounded-[24px] border border-[#F2EDE8]">
        <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[12px]">
          {t("ctaTitle")}
        </h2>
        <p className="font-afacad text-[16px] md:text-[18px] text-text-muted mb-[24px] max-w-[500px]">
          {t("ctaSubtitle")}
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            href="/"
            className="flex items-center justify-center px-[32px] h-[48px] rounded-[12px] bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bricolage font-semibold text-[16px] hover:opacity-90 transition-opacity"
          >
            {t("ctaButton")}
          </Link>
          <Link 
            href="/contact-us"
            className="flex items-center justify-center px-[28px] h-[48px] rounded-[12px] bg-white border border-[#E5DFDA] text-text-dark font-bricolage font-semibold text-[16px] hover:bg-gray-50 transition-colors"
          >
            Contact Team
          </Link>
        </div>
      </div>
      
    </div>
  );
}
