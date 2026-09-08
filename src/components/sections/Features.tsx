"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/client/auth-context";
import { useTranslations } from "next-intl";

export function Features({ mode = "svg-to-png" }: { mode?: "svg-to-png" | "raster-to-svg" | "background-remover" | "image-resizer" }) {
  const t = useTranslations("features");
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section id="features" className="flex flex-col items-center w-full mb-[60px] md:mb-[100px] scroll-mt-[100px] md:scroll-mt-[140px]">
      
      {/* Heading & Description */} 
      <div className="flex flex-col items-center w-full max-w-[361px] md:max-w-[900px] gap-[14px]">
        <h2 className="font-heading font-semibold text-[24px] leading-[30px] md:text-[48px] md:leading-[60px] tracking-[0.04em] text-center text-text-dark">
          {mode === "background-remover" ? (
            t("bgTitle")
          ) : mode === "image-resizer" ? (
            t("resizerTitle")
          ) : mode === "raster-to-svg" ? (
            t("rasterTitle")
          ) : (
            t("svgTitle")
          )}
        </h2>
        <p className="font-body font-normal text-[14px] md:text-[16px] leading-[18.67px] text-center text-text-muted">
          {mode === "background-remover" ? (
            t("bgDesc")
          ) : mode === "image-resizer" ? (
            t("resizerDesc")
          ) : mode === "svg-to-png" ? (
            t("svgDesc")
          ) : (
            t("rasterDesc")
          )}
        </p>
      </div>

      {/* Badges Row */}
      <div className="flex flex-wrap justify-center gap-[10px] md:gap-[39px] mt-[30px] md:mt-[62px] max-w-[361px] md:max-w-[1000px]">
        <Badge text={t("badgeFree")} />
        <Badge text={mode === "background-remover" ? t("badgeTransparentPng") : mode === "raster-to-svg" ? t("badgeScalableVector") : mode === "image-resizer" ? t("badgeExactPixels") : t("badgeMultipleSizes")} />
        <Badge text={mode === "background-remover" ? t("badgePrivate") : mode === "image-resizer" ? t("badgeRatioLock") : t("badgeTransparentBg")} />
        {mode === "raster-to-svg" && <Badge text={t("badgeColorControls")} />}
        {mode === "background-remover" && <Badge text={t("badgeNoInstall")} />}
        {mode === "image-resizer" && <Badge text={t("badgeFormatsOutput")} />}
        {(!mounted || !user) && <Badge text={t("badgeThreeFree")} />}
      </div>

    </section>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <div className="h-auto py-[8px] md:h-[43px] md:py-0 px-[16px] md:px-[24px] flex items-center justify-center gap-[8px] md:gap-[10px] rounded-[30px] border border-[#EAEAEA] bg-white shadow-[0px_4px_40px_rgba(0,0,0,0.04)]">
      <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <path d="M1.5 5.5L5 9L12.5 1.5" stroke="#D94A1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="font-body font-medium text-[14px] leading-[18.67px] text-text-dark whitespace-normal md:whitespace-nowrap text-center">
        {text}
      </span>
    </div>
  );
}
