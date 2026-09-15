"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { PwaInstallModal } from "./PwaInstallModal";

interface PwaInstallButtonProps {
  className?: string;
  variant?: "icon" | "nav" | "compact" | "drawer";
}

export function PwaInstallButton({
  className = "",
  variant = "icon",
}: PwaInstallButtonProps) {
  const t = useTranslations("pwa");
  const [showTooltip, setShowTooltip] = useState(false);
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isModalOpen,
    openModal,
    closeModal,
    promptInstall,
  } = usePWAInstall();

  // If already installed or browser does not support install, do not show button
  if (isInstalled || !isInstallable) {
    return null;
  }

  const handleClick = async () => {
    if (isIOS) {
      openModal();
    } else {
      const res = await promptInstall();
      if (res === "unsupported") {
        openModal();
      }
    }
  };

  return (
    <>
      {/* 1. Minimal Icon Button for Desktop Header */}
      {variant === "icon" && (
        <div className="relative inline-flex items-center">
          <button
            type="button"
            onClick={handleClick}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            aria-label={t("installApp")}
            className={`group relative flex items-center justify-center w-[34px] h-[34px] md:w-[36px] md:h-[36px] rounded-[9px] border border-[#EEE5DE] bg-[#FAF6F3] hover:bg-[#F2EDE8] text-text-dark hover:text-brand-primary hover:border-brand-primary/40 transition-all duration-200 shadow-[0px_1px_4px_rgba(32,36,39,0.04)] hover:shadow-[0px_3px_10px_rgba(217,74,30,0.12)] cursor-pointer ${className}`}
          >
            {/* Install / Download Icon */}
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-200 group-hover:-translate-y-0.5"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>

            {/* Subtle brand dot */}
            <span className="absolute top-[5px] right-[5px] w-[6px] h-[6px] rounded-full bg-brand-primary" />
          </button>

          {/* Sleek Floating Tooltip */}
          {showTooltip && (
            <div
              role="tooltip"
              className="pointer-events-none absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-[8px] bg-[#202427] text-white shadow-[0px_8px_20px_rgba(0,0,0,0.25)] whitespace-nowrap z-50 animate-in fade-in-0 zoom-in-95 duration-150 flex items-center gap-1.5"
            >
              <span className="font-heading font-medium text-[11.5px] leading-none">
                {t("installApp")}
              </span>
              <span className="w-1 h-1 rounded-full bg-[#FF9A3D]" />
              <span className="font-mono text-[10px] text-gray-300 leading-none">
                Offline
              </span>
              {/* Tooltip caret */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#202427] rotate-45" />
            </div>
          )}
        </div>
      )}

      {/* 2. Text + Icon Pill (Alternative compact pill) */}
      {variant === "nav" && (
        <button
          type="button"
          onClick={handleClick}
          aria-label={t("installApp")}
          className={`group flex items-center gap-1.5 h-[34px] px-2.5 rounded-[8px] border border-[#E8DED7] bg-white hover:bg-[#FAF6F3] text-text-body hover:text-brand-primary hover:border-brand-primary/40 transition-all duration-200 cursor-pointer text-[13px] font-body font-semibold shadow-[0px_1px_4px_rgba(32,36,39,0.04)] ${className}`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-hover:-translate-y-0.5 text-brand-primary"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="text-[12.5px]">{t("installApp")}</span>
        </button>
      )}

      {/* 3. Compact row for User Dropdown Menu */}
      {variant === "compact" && (
        <button
          type="button"
          onClick={handleClick}
          aria-label={t("installApp")}
          className={`flex items-center gap-2.5 w-full text-left px-4 py-2 font-body text-[13.5px] text-text-dark hover:text-brand-primary hover:bg-[#FAF6F3] rounded-[8px] transition-colors cursor-pointer ${className}`}
        >
          <span className="w-5 h-5 rounded-[6px] bg-[#FFF5F2] text-brand-primary flex items-center justify-center shrink-0 border border-brand-primary/20">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </span>
          <span className="font-medium">{t("installApp")}</span>
        </button>
      )}

      {/* 4. Drawer card for Mobile Menu */}
      {variant === "drawer" && (
        <button
          type="button"
          onClick={handleClick}
          aria-label={t("installApp")}
          className={`flex items-center justify-between w-full p-3 rounded-[12px] bg-gradient-to-r from-[#FFF7F3] to-[#FFFCFA] border border-[#D94A1E]/25 text-left transition-all hover:border-[#D94A1E]/50 active:scale-[0.99] cursor-pointer ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-[#D94A1E] to-[#FF7A45] flex items-center justify-center text-white shadow-[0px_3px_8px_rgba(217,74,30,0.25)] shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-semibold text-[14px] text-text-dark leading-tight">
                {t("installApp")}
              </span>
              <span className="font-body text-[11px] text-text-muted leading-tight mt-0.5">
                Fast desktop & mobile access
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold text-[#D94A1E] bg-white px-2 py-0.5 rounded-full border border-[#D94A1E]/20">
            Offline
          </span>
        </button>
      )}

      {/* PWA Install Modal */}
      <PwaInstallModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onInstall={async () => {
          await promptInstall();
        }}
        isIOS={isIOS}
      />
    </>
  );
}
