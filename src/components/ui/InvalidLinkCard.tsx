"use client";

import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { IMAGES } from "@/lib/shared/images";
import { useTranslations } from "next-intl";

interface InvalidLinkCardProps {
  /** The message to display. Falls back to i18n if not provided. */
  message?: string;
  /** The CTA link destination. */
  ctaHref?: string;
  /** The CTA button label. Falls back to i18n if not provided. */
  ctaLabel?: string;
}

export function InvalidLinkCard({
  message,
  ctaHref = "/signup",
  ctaLabel,
}: InvalidLinkCardProps) {
  const t = useTranslations("auth_pages.verification");

  return (
    <div className="w-full max-w-[440px] bg-[#FFFCFA] rounded-[8px] p-[24px_32px] shadow-[0px_4px_44px_0px_rgba(0,0,0,0.06)] flex flex-col mx-auto border-[1px] border-[#F2EDE8]">
      <div className="flex flex-col items-center text-center gap-6">
        <div className="flex items-center gap-[4px]">
          <Image
            src={IMAGES.logo}
            alt="CrushSVG Icon"
            width={26}
            height={26}
            className="object-contain"
          />
          <div className="font-heading font-semibold text-[16px] leading-[100%] tracking-[0%] flex items-center">
            <span className="text-text-dark">Crush</span>
            <span className="text-[#D94A1E]">SVG</span>
          </div>
        </div>

        <h2 className="font-heading font-bold text-[28px] md:text-[34px] leading-[100%] text-[#D94A1E] text-center">
          {t("title")}
        </h2>

        <div className="flex items-center justify-center">
          <Image
            src={IMAGES.lock}
            alt=""
            width={96}
            height={96}
            className="object-contain"
            style={{ width: "auto", height: "auto" }}
          />
        </div>

        <p className="font-body font-normal text-[14px] leading-[125%] text-[#4B5563] text-center w-full max-w-[294px]">
          {message || t("invalidMessage")}
        </p>

        <Link
          href={ctaHref}
          className="w-[238px] h-[42px] flex items-center justify-center rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-body font-medium text-[16px] hover:opacity-90 transition-opacity"
        >
          {ctaLabel || t("backToLogin")}
        </Link>
      </div>
    </div>
  );
}
