"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/client/auth-context";
import { useLocale, useTranslations } from "next-intl";

function renderFeaturesTitle(title: string) {
  const match = title.match(/(juggling design tools|überladener Software|programas complejos|logiciels complexes|softwares pesados|重いデザインソフト)/i);
  if (match) {
    const parts = title.split(match[0]);
    return (
      <>
        {parts[0]}
        <span className="text-brand-primary">{match[0]}</span>
        {parts.slice(1).join(match[0])}
      </>
    );
  }
  return title;
}

export function Features({ mode = "svg-to-png" }: { mode?: "svg-to-png" | "raster-to-svg" | "background-remover" | "image-resizer" | "svg-optimizer" | "favicon-generator" | "svg-to-react" }) {
  const t = useTranslations("features");
  const locale = useLocale();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const svgPngDescription = t("svgDesc");

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section id="features" className="flex min-w-0 flex-col items-center w-full mb-[60px] md:mb-[100px] scroll-mt-[100px] md:scroll-mt-[140px]">
      
      {/* Heading & Description */} 
      <div className="flex min-w-0 flex-col items-center w-full max-w-[900px] gap-[14px]">
        <h2 className={`w-full min-w-0 max-w-full break-words [overflow-wrap:anywhere] font-heading text-[24px] leading-[30px] tracking-[0.04em] text-center text-text-dark ${mode === "svg-to-png" && locale === "en" ? "font-bold md:text-[42px] md:leading-[56px]" : "font-semibold md:text-[48px] md:leading-[60px]"}`}>
          {mode === "svg-to-png" && locale === "en" ? (
            <>
              <span className="block">Why Convert SVG to PNG</span>
              <span className="block text-brand-primary">with CrushSVG?</span>
            </>
          ) : renderFeaturesTitle(
            mode === "background-remover"
              ? t("bgTitle")
              : mode === "image-resizer"
              ? t("resizerTitle")
              : mode === "svg-optimizer"
              ? t("optimizerTitle")
              : mode === "favicon-generator"
              ? t("faviconTitle")
              : mode === "svg-to-react"
              ? t("reactTitle")
              : mode === "raster-to-svg"
              ? t("rasterTitle")
              : t("svgTitle")
          )}
        </h2>
        <p className={`w-full min-w-0 break-words [overflow-wrap:anywhere] font-body font-normal text-center text-text-muted ${mode === "svg-to-png" && locale === "en" ? "max-w-[760px] text-[12px] leading-[20px]" : "max-w-[640px] text-[14px] leading-[20px] md:text-[16px] md:leading-[22px]"}`}>
          {mode === "background-remover" ? (
            t("bgDesc")
          ) : mode === "image-resizer" ? (
            t("resizerDesc")
          ) : mode === "svg-optimizer" ? (
            t("optimizerDesc")
          ) : mode === "favicon-generator" ? (
            t("faviconDesc")
          ) : mode === "svg-to-react" ? (
            t("reactDesc")
          ) : mode === "svg-to-png" ? (
            svgPngDescription
          ) : (
            t("rasterDesc")
          )}
        </p>
      </div>

      {mode === "svg-to-png" || mode === "raster-to-svg" ? (
        <div className="mt-[32px] md:mt-[40px] grid w-full max-w-[1028px] grid-cols-12 gap-x-[16px] gap-y-[28px] md:gap-x-[24px] md:gap-y-[44px]">
          {[
            { index: 1, title: t(mode === "svg-to-png" ? "seoSvgBenefit1Title" : "seoRasterBenefit1Title"), description: t(mode === "svg-to-png" ? "seoSvgBenefit1Desc" : "seoRasterBenefit1Desc") },
            { index: 2, title: t(mode === "svg-to-png" ? "seoSvgBenefit2Title" : "seoRasterBenefit2Title"), description: t(mode === "svg-to-png" ? "seoSvgBenefit2Desc" : "seoRasterBenefit2Desc") },
            { index: 3, title: t(mode === "svg-to-png" ? "seoSvgBenefit3Title" : "seoRasterBenefit3Title"), description: t(mode === "svg-to-png" ? "seoSvgBenefit3Desc" : "seoRasterBenefit3Desc") },
          ].map(({ index, title, description }) => (
            <article
              key={index}
              className="col-span-12 min-w-0 rounded-[20px] border border-[#FFA98F] bg-[#FDEBE4] p-[20px] sm:col-span-4 sm:p-[24px] md:p-[30px]"
            >
              <div className="mb-[14px] flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-white text-brand-primary">
                <BenefitIcon index={index} />
              </div>
              <h3 className="font-heading text-[18px] font-bold leading-[24px] text-[#171A23]">
                {title}
              </h3>
              <p className="mt-[10px] font-body text-[12px] leading-[17px] text-[#716761]">
                {description}
              </p>
            </article>
          ))}
        </div>
      ) : (
      /* Badges Row */
      <div className="flex min-w-0 max-w-full flex-wrap justify-center gap-[10px] md:gap-[39px] mt-[24px] md:mt-[62px] w-full max-w-[1000px]">
        <Badge text={t("badgeFree")} />
        <Badge
          text={
            mode === "background-remover"
              ? t("badgeTransparentPng")
              : mode === "image-resizer"
              ? t("badgeExactPixels")
              : mode === "svg-optimizer"
              ? t("badgeMinify")
              : mode === "favicon-generator"
              ? t("badgeMultiRes")
              : mode === "svg-to-react"
              ? t("badgeTypeScriptReady")
              : t("badgeMultipleSizes")
          }
        />
        <Badge
          text={
            mode === "background-remover"
              ? t("badgePrivate")
              : mode === "image-resizer"
              ? t("badgeRatioLock")
              : mode === "svg-optimizer"
              ? t("badgePrecision")
              : mode === "favicon-generator"
              ? t("badgeAppleAndroid")
              : mode === "svg-to-react"
              ? t("badgeFrameworkSupport")
              : t("badgeTransparentBg")
          }
        />
        {mode === "background-remover" && <Badge text={t("badgeNoInstall")} />}
        {mode === "image-resizer" && <Badge text={t("badgeFormatsOutput")} />}
        {mode === "svg-optimizer" && <Badge text={t("badgeZeroLag")} />}
        {mode === "favicon-generator" && <Badge text={t("badgeZipExport")} />}
        {mode === "svg-to-react" && <Badge text={t("badgeLucideStyle")} />}
        {(!mounted || !user) && <Badge text={t("badgeThreeFree")} />}
      </div>
      )}

    </section>
  );
}

function BenefitIcon({ index }: { index: number }) {
  const common = "h-[14px] w-[14px]";

  if (index === 1) {
    return <svg aria-hidden="true" className={common} viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (index === 2) {
    return <svg aria-hidden="true" className={common} viewBox="0 0 24 24" fill="none"><path d="M8 4H4v4m0-4 6 6m6 10h4v-4m0 4-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (index === 3) {
    return <svg aria-hidden="true" className={common} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M12 4a8 8 0 0 0 0 16V4Z" fill="currentColor"/><path d="M12 4v16" stroke="currentColor" strokeWidth="1.4"/></svg>;
  }
  return <svg aria-hidden="true" className={common} viewBox="0 0 24 24" fill="none"><path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>;
}

function Badge({ text }: { text: string }) {
  return (
    <div className="h-auto min-w-0 max-w-full py-[8px] md:h-[43px] md:py-0 px-[16px] md:px-[24px] flex items-center justify-center gap-[8px] md:gap-[10px] rounded-[30px] border border-[#EAEAEA] bg-white shadow-[0px_4px_40px_rgba(0,0,0,0.04)]">
      <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <path d="M1.5 5.5L5 9L12.5 1.5" stroke="#D94A1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="min-w-0 break-words [overflow-wrap:anywhere] font-body font-medium text-[14px] leading-[18.67px] text-text-dark whitespace-normal md:whitespace-nowrap text-center">
        {text}
      </span>
    </div>
  );
}
