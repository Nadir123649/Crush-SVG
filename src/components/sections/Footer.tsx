"use client";

import React from "react";
import Image from "next/image";
import { IMAGES } from "@/lib/shared/images";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function Footer({ logoUrl }: { logoUrl?: string }) {
  const pathname = usePathname();
  const t = useTranslations("footer");
  const isRasterToSvg = pathname === "/png-to-svg";

  const handleHashClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    const targetPath = hash.startsWith("/") ? hash.split("#")[0] : window.location.pathname;
    const targetHash = hash.includes("#") ? hash.split("#")[1] : hash.replace("#", "");
    
    if (typeof window !== "undefined" && (window.location.pathname === targetPath || targetPath === "")) {
      e.preventDefault();
      const el = document.getElementById(targetHash);
      if (el) {
        const offset = window.innerWidth >= 768 ? 96 : 70;
        const elementPosition = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elementPosition - offset,
          behavior: "smooth"
        });
      }
    }
  };

  const handlePageClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (typeof window !== "undefined" && window.location.pathname === href) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (href === "/") {
        window.history.pushState(null, "", "/");
      }
    }
  };

  return (
    <footer className="w-full bg-[#FCF1ED] flex flex-col items-center pt-[40px] md:pt-[60px] pb-[20px] px-[16px] md:px-[40px] lg:px-[80px]">
      <div className="w-full max-w-[1280px] flex flex-col lg:flex-row justify-between items-center lg:items-start gap-[32px] lg:gap-0">

        {/* Left: Logo & Desc */}
        <div className="flex flex-col items-center lg:items-start w-full md:w-[400px] lg:w-[276px] gap-[12px] text-center lg:text-left">
          <Link href="/" onClick={(e) => handlePageClick(e, '/')} aria-label="CrushSVG homepage" className="flex items-center gap-[10px]">
            <Image
              src={logoUrl || IMAGES.logo}
              alt="CrushSVG Logo"
              width={42}
              height={42}
              className="w-[42px] h-[42px] object-contain"
            />
            <div className="font-heading font-semibold text-[26px] leading-[18.67px] tracking-[0%] flex items-center">
              <span className="text-text-dark">Crush</span>
              <span className="text-brand-primary">SVG</span>
            </div>
          </Link>
          <p className="font-body font-normal text-[12px] leading-[12px] text-[#4B5563] mt-[4px] md:mt-[8px]">
            {isRasterToSvg ? t("taglineRaster") : t("taglineSvg")}<br className="hidden md:inline" />{" "}
            {isRasterToSvg ? t("subtaglineRaster") : t("subtaglineSvg")}
          </p>
        </div>

        {/* Engineered For Quality (Shown in middle on mobile/tablet) */}
        <div className="flex flex-col items-center lg:hidden w-full gap-[12px] text-center">
          <h4 className="font-heading font-bold text-[12px] leading-[120%] text-[#353A3E]">{t("qualityTitle")}</h4>
          <div className="flex flex-wrap justify-center gap-[8px]">
            <div className="h-[32px] px-[10px] bg-white rounded-[4px] border border-[#EAEAEA] flex items-center justify-center gap-[6px]">
              <div className="w-[6px] h-[6px] rounded-full bg-[#D94A1E]"></div>
              <span className="font-body text-[12px] font-medium text-[#4B5563]">{t("browserBased")}</span>
            </div>
            <div className="h-[32px] px-[10px] bg-white rounded-[4px] border border-[#EAEAEA] flex items-center justify-center gap-[6px]">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="4.5" cy="4.5" r="3" fill="#D94A1E" fillOpacity="0.3" />
                <circle cx="8" cy="8" r="3" fill="#D94A1E" />
              </svg>
              <span className="font-body text-[12px] font-medium text-[#4B5563]">{t("transparentPng")}</span>
            </div>
            <div className="h-[32px] px-[10px] bg-white rounded-[4px] border border-[#EAEAEA] flex items-center justify-center gap-[6px]">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.66667 11.0833L1.16667 7.58333L2.33333 6.41667L4.66667 8.75L11.6667 1.75L12.8333 2.91667L4.66667 11.0833Z" fill="#D94A1E" />
              </svg>
              <span className="font-body text-[12px] font-medium text-[#4B5563]">{t("noInstall")}</span>
            </div>
          </div>
        </div>

        {/* Middle: Links */}
        <div className="flex flex-col md:flex-row gap-[24px] md:gap-[40px] lg:gap-[48px] ml-0 lg:ml-[40px] items-center text-center md:text-left">
          {/* Column 1: Explore */}
          <div className="flex flex-col items-center md:items-start w-auto md:w-[135px] gap-[10px] md:gap-[14px]">
            <h4 className="font-heading font-bold text-[14px] leading-[100%] text-[#202427] mb-[4px]">{t("explore")}</h4>
            {isRasterToSvg ? (
              <Link href={"/#converter" as any} onClick={(e) => {
                if (typeof window !== "undefined" && window.location.pathname === "/") {
                  handleHashClick(e, '#converter');
                }
              }} className="font-body font-normal text-[14px] md:text-[12px] leading-[100%] text-[#374151] hover:text-brand-primary transition-colors">{t("svgConverter")}</Link>
            ) : (
              <Link href={"/png-to-svg#converter" as any} onClick={(e) => {
                if (typeof window !== "undefined" && window.location.pathname === "/png-to-svg") {
                  handleHashClick(e, '#converter');
                }
              }} className="font-body font-normal text-[14px] md:text-[12px] leading-[100%] text-[#374151] hover:text-brand-primary transition-colors">{t("pngConverter")}</Link>
            )}
            <Link href={"/#features" as any} onClick={(e) => handleHashClick(e, '#features')} className="font-body font-normal text-[14px] md:text-[12px] leading-[100%] text-[#374151] hover:text-brand-primary transition-colors">{t("features")}</Link>
            <Link href={"/#how-it-works" as any} onClick={(e) => handleHashClick(e, '#how-it-works')} className="font-body font-normal text-[14px] md:text-[12px] leading-[100%] text-[#374151] hover:text-brand-primary transition-colors">{t("howItWorks")}</Link>
            <Link href="/changelog" onClick={(e) => handlePageClick(e, '/changelog')} className="font-body font-normal text-[14px] md:text-[12px] leading-[100%] text-[#374151] hover:text-brand-primary transition-colors">{t("changelog")}</Link>
          </div>
          {/* Column 2: Resources */}
          <div className="flex flex-col items-center md:items-start w-auto md:w-[135px] gap-[10px] md:gap-[14px]">
            <h4 className="font-heading font-bold text-[14px] leading-[100%] text-[#202427] mb-[4px]">{t("resources")}</h4>
            <Link href="/svg-guides" onClick={(e) => handlePageClick(e, '/svg-guides')} className="font-body font-normal text-[14px] md:text-[12px] leading-[100%] text-[#374151] hover:text-brand-primary transition-colors">{t("svgGuides")}</Link>
            <Link href="/help" onClick={(e) => handlePageClick(e, '/help')} className="font-body font-normal text-[14px] md:text-[12px] leading-[100%] text-[#374151] hover:text-brand-primary transition-colors">{t("helpFaq")}</Link>
            <Link href="/support" onClick={(e) => handlePageClick(e, '/support')} className="font-body font-normal text-[14px] md:text-[12px] leading-[100%] text-[#374151] hover:text-brand-primary transition-colors">{t("supportHub")}</Link>
            <Link href="/contact-us" onClick={(e) => handlePageClick(e, '/contact-us')} className="font-body font-normal text-[14px] md:text-[12px] leading-[100%] text-[#374151] hover:text-brand-primary transition-colors">{t("contactUs")}</Link>
          </div>
          {/* Column 3: Company */}
          <div className="flex flex-col items-center md:items-start w-auto md:w-[135px] gap-[10px] md:gap-[14px]">
            <h4 className="font-heading font-bold text-[14px] leading-[100%] text-[#202427] mb-[4px]">{t("company")}</h4>
            <Link href="/about" onClick={(e) => handlePageClick(e, '/about')} className="font-body font-normal text-[14px] md:text-[12px] leading-[100%] text-[#374151] hover:text-brand-primary transition-colors">{t("aboutUs")}</Link>
            <Link href="/team" onClick={(e) => handlePageClick(e, '/team')} className="font-body font-normal text-[14px] md:text-[12px] leading-[100%] text-[#374151] hover:text-brand-primary transition-colors">{t("ourTeam")}</Link>
            <Link href="/privacy-policy" onClick={(e) => handlePageClick(e, '/privacy-policy')} className="font-body font-normal text-[14px] md:text-[12px] leading-[100%] text-[#374151] hover:text-brand-primary transition-colors">{t("privacyPolicy")}</Link>
            <Link href="/terms" onClick={(e) => handlePageClick(e, '/terms')} className="font-body font-normal text-[14px] md:text-[12px] leading-[100%] text-[#374151] hover:text-brand-primary transition-colors">{t("termsOfService")}</Link>
          </div>
          {/* Column 4: Use Cases */}
          <div className="flex flex-col items-center md:items-start w-auto md:w-[135px] gap-[10px] md:gap-[14px]">
            <h4 className="font-heading font-bold text-[14px] leading-[100%] text-[#202427] mb-[4px]">{t("useCases")}</h4>
            <Link href={"/use-case/svg-to-png-for-react" as any} onClick={(e) => handlePageClick(e, '/use-case/svg-to-png-for-react')} className="font-body font-normal text-[14px] md:text-[12px] leading-[100%] text-[#374151] hover:text-brand-primary transition-colors">{t("reactNext")}</Link>
            <Link href={"/use-case/svg-to-png-for-email-signatures" as any} onClick={(e) => handlePageClick(e, '/use-case/svg-to-png-for-email-signatures')} className="font-body font-normal text-[14px] md:text-[12px] leading-[100%] text-[#374151] hover:text-brand-primary transition-colors">{t("emailSignatures")}</Link>
            <Link href={"/use-case/svg-to-png-transparent-background" as any} onClick={(e) => handlePageClick(e, '/use-case/svg-to-png-transparent-background')} className="font-body font-normal text-[14px] md:text-[12px] leading-[100%] text-[#374151] hover:text-brand-primary transition-colors">{t("transparentBg")}</Link>
            <Link href={"/use-case/high-resolution-svg-to-png" as any} onClick={(e) => handlePageClick(e, '/use-case/high-resolution-svg-to-png')} className="font-body font-normal text-[14px] md:text-[12px] leading-[100%] text-[#374151] hover:text-brand-primary transition-colors">{t("highResolution")}</Link>
          </div>
        </div>

        {/* Right: Engineered For Quality (Desktop only) */}
        <div className="hidden lg:flex flex-col w-[340px] gap-[21px]">
          <h4 className="font-heading font-bold text-[12px] md:text-[14px] leading-[120%] text-[#353A3E] text-center">{t("qualityTitle")}</h4>

          {/* 3 Quality Badges */}
          <div className="flex justify-center gap-[12px]">
            <div className="h-[39px] px-[12px] bg-white rounded-[4px] border border-[#EAEAEA] flex items-center justify-center gap-[8px]">
              <div className="w-[6px] h-[6px] rounded-full bg-[#D94A1E]"></div>
              <span className="font-body text-[12px] font-medium text-[#4B5563]">{t("browserBased")}</span>
            </div>
            <div className="h-[39px] px-[12px] bg-white rounded-[4px] border border-[#EAEAEA] flex items-center justify-center gap-[8px]">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="4.5" cy="4.5" r="3" fill="#D94A1E" fillOpacity="0.3" />
                <circle cx="8" cy="8" r="3" fill="#D94A1E" />
              </svg>
              <span className="font-body text-[12px] font-medium text-[#4B5563]">{t("transparentPng")}</span>
            </div>
            <div className="h-[39px] px-[12px] bg-white rounded-[4px] border border-[#EAEAEA] flex items-center justify-center gap-[8px]">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.66667 11.0833L1.16667 7.58333L2.33333 6.41667L4.66667 8.75L11.6667 1.75L12.8333 2.91667L4.66667 11.0833Z" fill="#D94A1E" />
              </svg>
              <span className="font-body text-[12px] font-medium text-[#4B5563]">{t("noInstall")}</span>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center gap-[24px] mt-[7px]">
            <a href="https://www.facebook.com/profile.php?id=61593405728605" target="_blank" rel="noopener noreferrer" aria-label="Visit CrushSVG on Facebook" className="hover:opacity-80 transition-opacity">
              <Image src={IMAGES.facebook} alt="Facebook logo" width={16} height={16} className="w-[16px] h-[16px] object-contain" />
            </a>
            <a href="https://www.instagram.com/crushsvg_net/" target="_blank" rel="noopener noreferrer" aria-label="Visit CrushSVG on Instagram" className="hover:opacity-80 transition-opacity">
              <Image src={IMAGES.instagram} alt="Instagram logo" width={16} height={16} className="w-[16px] h-[16px] object-contain" />
            </a>
            <a href="https://www.linkedin.com/company/crushsvg/" target="_blank" rel="noopener noreferrer" aria-label="Visit CrushSVG on LinkedIn" className="hover:opacity-80 transition-opacity">
              <Image src={IMAGES.linkedin} alt="LinkedIn logo" width={16} height={16} className="w-[16px] h-[16px] object-contain" />
            </a>
          </div>
        </div>

        {/* Mobile/Tablet Social Section */}
        <div className="flex flex-col lg:hidden w-full items-center">
          {/* Divider Above Social Icons (Mobile) */}
          <div className="w-full h-[1px] bg-[#353A3E] opacity-10 mb-[16px]"></div>

          {/* Social Icons (Mobile) */}
          <div className="flex justify-center gap-[24px]">
            <a href="https://www.facebook.com/profile.php?id=61593405728605" target="_blank" rel="noopener noreferrer" aria-label="Visit CrushSVG on Facebook" className="hover:opacity-80 transition-opacity">
              <Image src={IMAGES.facebook} alt="Facebook logo" width={16} height={16} className="w-[16px] h-[16px] object-contain" />
            </a>
            <a href="https://www.instagram.com/crushsvg_net/" target="_blank" rel="noopener noreferrer" aria-label="Visit CrushSVG on Instagram" className="hover:opacity-80 transition-opacity">
              <Image src={IMAGES.instagram} alt="Instagram logo" width={16} height={16} className="w-[16px] h-[16px] object-contain" />
            </a>
            <a href="https://www.linkedin.com/company/crushsvg/" target="_blank" rel="noopener noreferrer" aria-label="Visit CrushSVG on LinkedIn" className="hover:opacity-80 transition-opacity">
              <Image src={IMAGES.linkedin} alt="LinkedIn logo" width={16} height={16} className="w-[16px] h-[16px] object-contain" />
            </a>
          </div>
        </div>

      </div>

      {/* Divider */}
      <div className="w-full max-w-[1280px] h-[1px] bg-[#353A3E] opacity-10 mt-[12px] md:mt-[60px] mb-[16px] md:mb-[20px]"></div>

      {/* Bottom Footer */}
      <div className="w-full max-w-[1280px] flex flex-col-reverse md:flex-row justify-between items-center gap-[16px] md:gap-0 mb-[10px] text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-[8px] md:gap-[12px]">
          <span className="font-body font-normal text-[12px] leading-[100%] text-[#4B5563]">
            {t("allRightsReserved")}
          </span>
          <span className="hidden md:inline font-body font-normal text-[12px] leading-[100%] text-[#4B5563]">|</span>
          <span className="font-body font-normal text-[12px] leading-[100%] text-[#4B5563]">
            Powered by <a href="https://www.thenevon.com/" target="_blank" rel="noopener noreferrer" aria-label="Visit The Nevon website" className="text-brand-primary cursor-pointer hover:opacity-80 transition-opacity">@The Nevon</a>
          </span>
        </div>
        <div className="font-body font-normal text-[12px] leading-[100%] text-[#4B5563] flex items-center">
          <Link href="/terms" onClick={(e) => handlePageClick(e, '/terms')} className="hover:text-brand-primary transition-colors">{t("terms")}</Link>
          <span className="mx-[8px]">•</span>
          <Link href="/privacy-policy" onClick={(e) => handlePageClick(e, '/privacy-policy')} className="hover:text-brand-primary transition-colors">{t("privacy")}</Link>
          <span className="mx-[8px]">•</span>
          <Link href="/cookies" onClick={(e) => handlePageClick(e, '/cookies')} className="hover:text-brand-primary transition-colors">{t("cookies")}</Link>
          <span className="mx-[8px]">•</span>
          <Link href="/blog" onClick={(e) => handlePageClick(e, '/blog')} className="hover:text-brand-primary transition-colors">{t("blog")}</Link>
          <span className="mx-[8px]">•</span>
          <Link href="/support" onClick={(e) => handlePageClick(e, '/support')} className="hover:text-brand-primary transition-colors">{t("support")}</Link>
        </div>
      </div>
    </footer>
  );
}
