"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => Promise<void>;
  isIOS: boolean;
}

export function PwaInstallModal({
  isOpen,
  onClose,
  onInstall,
  isIOS,
}: PwaInstallModalProps) {
  const t = useTranslations("pwa");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] bg-white rounded-[24px] border border-[#F2EDE8] shadow-[0px_20px_50px_rgba(0,0,0,0.2)] p-6 sm:p-7 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background gradient decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[240px] h-[120px] bg-gradient-to-b from-[#D94A1E]/15 to-transparent blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F5F2EE] hover:bg-[#EAE4DD] flex items-center justify-center text-text-muted hover:text-text-dark transition-colors cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M13 1L1 13M1 1L13 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-[#D94A1E] to-[#FF7A45] flex items-center justify-center shadow-[0px_8px_20px_rgba(217,74,30,0.3)] mb-4">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>

          <h3
            id="pwa-modal-title"
            className="font-heading font-bold text-[22px] sm:text-[24px] text-text-dark leading-tight"
          >
            {t("installTitle")}
          </h3>
          <p className="font-body text-[14px] text-text-muted mt-2 leading-relaxed">
            {t("installDescription")}
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="my-6 space-y-3 bg-[#FCFBF9] p-4 rounded-[16px] border border-[#F2EDE8]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#D94A1E]/10 flex items-center justify-center text-[#D94A1E] shrink-0 font-bold text-[12px]">
              ⚡
            </div>
            <span className="font-body text-[13px] sm:text-[14px] text-text-dark font-medium">
              {t("installBenefitSpeed")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#D94A1E]/10 flex items-center justify-center text-[#D94A1E] shrink-0 font-bold text-[12px]">
              🔌
            </div>
            <span className="font-body text-[13px] sm:text-[14px] text-text-dark font-medium">
              {t("installBenefitOffline")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#D94A1E]/10 flex items-center justify-center text-[#D94A1E] shrink-0 font-bold text-[12px]">
              🛡️
            </div>
            <span className="font-body text-[13px] sm:text-[14px] text-text-dark font-medium">
              {t("installBenefitPrivate")}
            </span>
          </div>
        </div>

        {/* Actions / Instructions */}
        {isIOS ? (
          <div className="p-4 rounded-[16px] bg-[#FFF8F5] border border-[#FCD9CC] text-left">
            <p className="font-body font-semibold text-[13px] text-[#D94A1E] mb-2 flex items-center gap-1.5">
              <span>📱</span> {t("iosInstructionsTitle")}
            </p>
            <ol className="list-decimal list-inside space-y-1 font-body text-[12px] text-text-body leading-relaxed pl-1">
              <li>{t("iosStep1")}</li>
              <li>{t("iosStep2")}</li>
              <li>{t("iosStep3")}</li>
            </ol>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onInstall}
              className="w-full py-3.5 px-6 rounded-[14px] bg-gradient-to-r from-[#D94A1E] to-[#FF6B35] hover:from-[#C23F16] hover:to-[#E55A28] text-white font-body font-semibold text-[15px] shadow-[0px_6px_20px_rgba(217,74,30,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>{t("installNow")}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-[12px] text-text-muted hover:text-text-dark font-body text-[13px] transition-colors cursor-pointer"
            >
              {t("maybeLater")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
