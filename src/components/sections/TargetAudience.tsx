"use client";

import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { IMAGES } from "@/lib/shared/images";
import { useTranslations } from "next-intl";

export function TargetAudience({ mode = "svg-to-png" }: { mode?: "svg-to-png" | "raster-to-svg" | "image-resizer" }) {
  const t = useTranslations("target_audience");

  const cards = mode === "raster-to-svg" ? [
    {
      icon: IMAGES.message,
      title: t("webDevTitle"),
      description: "Convert raster logos and bitmap icons into lightweight, scalable SVG vectors for fast web performance.",
      href: "/svg-guides",
      linkText: t("readVectorGuide"),
    },
    {
      icon: IMAGES.marketing,
      title: t("marketersTitle"),
      description: "Turn raster badges and product illustrations into crisp vector assets that scale cleanly across all screens.",
      href: "/svg-guides",
      linkText: t("exploreGuides"),
    },
    {
      icon: IMAGES.agencies,
      title: t("agenciesTitle"),
      description: "Deliver high-quality vector assets for clients in seconds without needing heavy desktop design tools.",
      href: "/png-to-svg#converter",
      linkText: t("vectorizeFast"),
    },
    {
      icon: IMAGES.designers,
      title: t("designersTitle"),
      description: "Transform bitmap sketches and icons into editable vector paths ready for Figma, Sketch, and Illustrator.",
      href: "/svg-guides",
      linkText: t("figmaGuide"),
    },
  ] : mode === "image-resizer" ? [
    {
      icon: IMAGES.message,
      title: "Content Creators",
      description: "Resize photos and graphics to exact platform dimensions for Instagram, YouTube thumbnails, and blog posts.",
      href: "/image-resizer#converter",
      linkText: "Resize Your Images",
    },
    {
      icon: IMAGES.marketing,
      title: t("marketersTitle"),
      description: "Quickly resize campaign visuals to fit every ad placement and social media format without design tools.",
      href: "/image-resizer#converter",
      linkText: "Resize for Campaigns",
    },
    {
      icon: IMAGES.agencies,
      title: t("agenciesTitle"),
      description: "Deliver correctly sized assets to clients in seconds. No more back-and-forth about image dimensions.",
      href: "/image-resizer#converter",
      linkText: "Resize Client Assets",
    },
    {
      icon: IMAGES.designers,
      title: t("designersTitle"),
      description: "Export images at exact pixel dimensions for web, mobile, and print with aspect ratio lock to prevent distortion.",
      href: "/image-resizer#converter",
      linkText: "Resize Design Assets",
    },
  ] : [
    {
      icon: IMAGES.message,
      title: t("webDevTitle"),
      description: t("webDevDesc"),
      href: "/svg-guides#svg-to-png-email",
      linkText: t("readVectorGuide"),
    },
    {
      icon: IMAGES.marketing,
      title: t("marketersTitle"),
      description: t("marketersDesc"),
      href: "/svg-guides",
      linkText: t("exploreGuides"),
    },
    {
      icon: IMAGES.agencies,
      title: t("agenciesTitle"),
      description: t("agenciesDesc"),
      href: "/#converter",
      linkText: t("vectorizeFast"),
    },
    {
      icon: IMAGES.designers,
      title: t("designersTitle"),
      description: t("designersDesc"),
      href: "/svg-guides#figma-svg-to-transparent-png",
      linkText: t("figmaGuide"),
    },
  ];

  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (typeof window !== "undefined" && href.includes("#")) {
      const [path, hash] = href.split("#");
      const currentPath = window.location.pathname;

      const isCurrentPage =
        path === "" ||
        currentPath === path ||
        (path === "/" && currentPath === "/") ||
        (path === "" && currentPath === "/");

      if (isCurrentPage) {
        const element = document.getElementById(hash);
        if (element) {
          e.preventDefault();
          const headerOffset = window.innerWidth >= 768 ? 92 : 66;
          const elementPosition = element.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: elementPosition - headerOffset + 2,
            behavior: "smooth"
          });
          window.history.pushState(null, "", `${path || currentPath}#${hash}`);
        }
      }
    }
  };

  return (
    <section className="w-full flex flex-col items-center mb-[60px] md:mb-[100px] mt-[20px] md:mt-[30px]">
      {/* Heading */}
      <h2 className="font-heading font-semibold text-[24px] leading-[30px] md:text-[48px] md:leading-[61px] tracking-[0.04em] text-center text-text-dark mb-[30px] md:mb-[60px]">
        {t("svgTitle")}
      </h2>

      {/* Cards Container */}
      <div className="w-full max-w-[360px] md:max-w-[720px] lg:max-w-[1280px] flex flex-col md:grid md:grid-cols-2 lg:grid-cols-4 gap-[16px] md:gap-[40px]">
        {cards.map((card, index) => (
          <Link
            href={card.href as any}
            key={index} 
            onClick={(e) => handleCardClick(e, card.href)}
            aria-label={card.linkText}
            className="flex flex-row md:flex-col w-full bg-white rounded-[12px] md:rounded-[24px] border border-[#F4F4F4] p-[10px] md:p-[24px] gap-[12px] md:gap-0 transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(217,74,30,0.2)] hover:-translate-y-2 cursor-pointer items-center md:items-stretch group"
          >
            {/* Image Box */}
            <div className="w-[155px] h-[140px] md:w-full md:h-[120px] rounded-[12px] bg-[#FCF1ED] flex items-center justify-center shrink-0">
              <Image 
                src={card.icon} 
                alt={card.title} 
                width={32} 
                height={32} 
                className="object-contain w-[32px] h-[32px]"
              />
            </div>

            {/* Text Content */}
            <div className="flex flex-col justify-center md:justify-start gap-[8px] w-full min-w-0 flex-1">
              <h3 className="font-heading font-semibold text-[18px] md:text-[20px] leading-[22px] md:leading-[26px] tracking-[0.04em] text-text-dark mt-0 md:mt-[20px] group-hover:text-brand-primary transition-colors">
                {card.title}
              </h3>
              <p className="font-body font-normal text-[14px] md:text-[14px] leading-[18.67px] md:leading-[20px] text-text-muted">
                {card.description}
              </p>
              <span className="text-xs font-semibold text-brand-primary mt-1 md:mt-auto hidden md:inline-flex items-center gap-1 group-hover:underline">
                {card.linkText} &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
