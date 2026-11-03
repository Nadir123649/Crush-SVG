import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { IMAGES } from "@/lib/shared/images";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

interface VerificationModalProps {
  variant?: "success" | "invalid";
  onClose?: () => void;
  onContinue?: () => void;
  /** Invalid variant: the CTA link destination. Defaults to the sign-up flow. */
  ctaHref?: string;
  /** Invalid variant: the CTA button label. Falls back to i18n if not provided. */
  ctaLabel?: string;
}

export function VerificationModal({
  variant = "success",
  onClose,
  onContinue,
  ctaHref = "/signup",
  ctaLabel,
}: VerificationModalProps) {
  const isSuccess = variant === "success";
  const t = useTranslations("auth_pages.verification");

  return (
    <div className="w-full max-w-[440px] bg-[#FFFCFA] rounded-[8px] p-[24px_16px] sm:p-[24px_32px] shadow-[0px_4px_44px_0px_rgba(0,0,0,0.06)] flex flex-col mx-auto border-[1px] border-[#F2EDE8]">
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

        {/* Heading */}
        <h2 className="font-heading font-bold text-[28px] md:text-[34px] leading-[100%] text-[#D94A1E] text-center">
          {t("title")}
        </h2>

        <div className="flex items-center justify-center my-2">
          {isSuccess ? (
            <Image
              src={IMAGES.verification}
              alt=""
              width={206}
              height={98}
              className="object-contain"
              style={{ width: "auto", height: "auto" }}
            />
          ) : (
            <div className="w-[80px] h-[80px] rounded-full bg-[#FFE3DA] flex items-center justify-center shadow-inner">
              <svg width="36" height="44" viewBox="0 0 7 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 4H1C0.447715 4 0 4.44772 0 5V9C0 9.55228 0.447715 10 1 10H6C6.55228 10 7 9.55228 7 9V5C7 4.44772 6.55228 4 6 4Z" fill="#D94A1E"/>
                <path d="M1 5V3C1 2.33696 1.26339 1.70107 1.73223 1.23223C2.20107 0.763392 2.83696 0.5 3.5 0.5C4.16304 0.5 4.79893 0.763392 5.26777 1.23223C5.73661 1.70107 6 2.33696 6 3V5" stroke="#D94A1E" strokeWidth="0.8"/>
              </svg>
            </div>
          )}
        </div>

        {/* Text Body */}
        <p className="font-body font-normal text-[14px] leading-[125%] text-[#4B5563] text-center w-full max-w-[294px]">
          {isSuccess
            ? t("successMessage")
            : t("invalidMessage")}
        </p>

        {isSuccess && (
          <Button variant="solid" className="w-[238px] h-[42px]" onClick={onContinue}>
            {t("continueButton")}
          </Button>
        )}
        {!isSuccess && (
          <Link
            href={ctaHref}
            className="w-[238px] h-[42px] flex items-center justify-center rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-body font-medium text-[16px] hover:opacity-90 transition-opacity"
          >
            {ctaLabel || t("backToLogin")}
          </Link>
        )}
      </div>
    </div>
  );
}
