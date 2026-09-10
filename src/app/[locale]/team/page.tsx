import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
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
  const t = await getTranslations({ locale, namespace: "team_page" });

  return constructLocalizedMetadata({
    locale,
    routeKey: "/team",
    title: t("metaTitle"),
    description: t("metaDesc"),
  });
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "team_page" });

  const teamSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${SITE_URL}/team#webpage`,
    name: t("metaTitle"),
    url: `${SITE_URL}${locale === "en" ? "/team" : `/${locale}/team`}`,
    description: t("metaDesc"),
    publisher: {
      "@type": "Organization",
      name: "The Nevon",
      url: "https://www.thenevon.com",
    },
  };

  const team = [
    {
      name: "Sardar Muhammad Nadir",
      role: "CEO and Founder",
      bio: "Visionary entrepreneur and tech leader driving the strategic direction of The Nevon. Nadir is focused on building high-impact SaaS products and scaling teams.",
      initials: "SN",
      linkedin: "https://www.linkedin.com/in/nadir1214/",
      skills: ["Business Strategy", "Product Vision", "Team Leadership", "Venture Growth"],
    },
    {
      name: "Muhammad Aswad Khan",
      role: "Project Manager",
      bio: "Dedicated project manager bridging the gap between design, engineering, and business goals. Aswad oversees Agile workflows and ensures timely, high-quality delivery.",
      initials: "AK",
      linkedin: "https://www.linkedin.com/in/muhammad-aswad-khan/",
      skills: ["Agile Management", "Sprint Planning", "Team Coordination", "Product Delivery"],
    },
    {
      name: "Muhammad Hassan Irfan",
      role: "Lead Full-Stack Developer",
      bio: "Full-stack engineer focused on building secure, scalable, and high-performance digital products. Hassan turns complex requirements into polished, production-ready solutions.",
      initials: "HI",
      linkedin: "https://www.linkedin.com/in/muhammad-hassan-irfan-a97059421/",
      skills: ["Full-Stack Engineering", "MERN & Next.js", "AI Engineering", "WordPress"],
    },
    {
      name: "Abdul Raheem",
      role: "Frontend Engineer",
      bio: "Frontend Engineer focused on building responsive, high-performance, and user-friendly digital products. Abdul turns complex designs into polished, scalable interfaces.",
      initials: "AR",
      linkedin: "https://www.linkedin.com/in/develepor-raheem/",
      skills: ["Frontend Architecture", "React & Next.js", "Responsive UI", "System Design"],
    },
    {
      name: "Ali Aun",
      role: "QA & Digital Experience Specialist",
      bio: "Turning ideas into polished products through quality assurance, AI-powered automation, and digital strategy. Ali oversees product testing and UI/UX feedback across The Nevon.",
      initials: "AA",
      linkedin: "https://www.linkedin.com/in/ali-aun/",
      skills: ["QA & Testing", "AI Automation", "Content Strategy", "UI/UX Feedback"],
    },
    {
      name: "Mishal",
      role: "UI/UX Designer",
      bio: "Creating intuitive, engaging, and visually refined digital experiences through user-centered design. Mishal transforms product requirements into clean and functional interfaces.",
      initials: "M",
      linkedin: "https://www.linkedin.com/in/mishal-rajpoot-79323741b",
      skills: ["UI/UX Design", "User-Centered Design", "Design Systems", "Responsive Design"],
    },
  ];

  return (
    <div className="w-full flex flex-col items-center md:pb-[60px] min-h-[60vh]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(teamSchema) }}
      />

      {/* Hero Section */}
      <Hero
        badge={t("badge")}
        title={<>{t("title").split(" ")[0]} <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">{t("title").split(" ").slice(1).join(" ")}</span></>}
        subtitle={<>{t("subtitle")} <a href="https://www.thenevon.com" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline font-medium">The Nevon</a>.</>}
        className="mb-[32px] md:mb-[60px]"
      />

      {/* Team Grid */}
      <div className="w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {team.map((member) => (
          <a
            key={member.name}
            href={member.linkedin || "#"}
            target={member.linkedin ? "_blank" : undefined}
            rel={member.linkedin ? "noopener noreferrer" : undefined}
            className="flex flex-col bg-white rounded-[20px] p-6 md:p-8 border border-[#F2EDE8] relative group cursor-pointer hover:border-brand-primary/20 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}
          >
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-[#FFFCFA] border border-[#F2EDE8] flex items-center justify-center shadow-sm overflow-hidden relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/10 to-brand-secondary/10"></div>
                <span className="relative z-10 text-brand-primary font-heading font-bold text-2xl">{member.initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-heading font-semibold text-xl text-text-dark truncate">
                    {member.name.replace("Muhammad ", "M. ")}
                  </h2>
                  {member.linkedin && (
                    <div className="opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Image src={IMAGES.linkedin} alt="LinkedIn" width={20} height={20} className="w-[20px] h-[20px] object-contain" />
                    </div>
                  )}
                </div>
                <div className="h-[40px] flex flex-col justify-center">
                  <p className="text-sm font-semibold text-brand-primary line-clamp-2 leading-tight">
                    {member.role}
                  </p>
                </div>
              </div>
            </div>

            <p className="font-afacad text-[16px] md:text-[16px] text-text-muted leading-[1.6] mb-6 flex-1">
              {member.bio}
            </p>

            <div className="pt-4 border-t border-[#F2EDE8]">
              <p className="text-xs font-semibold text-text-dark uppercase tracking-wider mb-2">Focus Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {member.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs px-2.5 py-1 rounded-md bg-[#FBF9F7] border border-[#EFE9E4] text-text-dark font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Parent Organization Highlight */}
      <div className="w-full max-w-[1200px] bg-white rounded-[24px] p-8 md:p-12 border border-[#F2EDE8] flex flex-col md:flex-row items-center justify-between gap-8 mb-12" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
        <div className="flex-1 max-w-[650px]">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FCF1ED] text-brand-primary uppercase tracking-wider">
            {t("joinTitle")}
          </span>
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-text-dark mt-3 mb-3">
            Crafting the Future of Web Tools
          </h2>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-relaxed">
            {t("joinDesc")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <a
            href="https://www.thenevon.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-8 h-12 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bricolage font-semibold text-base hover:opacity-90 transition-opacity"
          >
            {t("contactNevon")}
          </a>
          <Link
            href="/contact-us"
            className="flex items-center justify-center px-6 h-12 rounded-xl bg-white border border-[#E5DFDA] text-text-dark font-bricolage font-semibold text-base hover:bg-gray-50 transition-colors"
          >
            Contact Team
          </Link>
        </div>
      </div>
    </div>
  );
}
