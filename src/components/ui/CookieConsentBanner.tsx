"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { updateConsentDenied, updateConsentGranted } from "@/lib/client/analytics";

const CONSENT_KEY = "crush_cookie_consent";
const CONSENT_EVENT = "crushConsentChanged";

type ConsentValue = "granted" | "denied" | null;

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<ConsentValue | "loading">("loading");
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("cookie_consent");

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(CONSENT_KEY) as ConsentValue | null;
    // If previously granted, immediately fire consent update for this session
    if (stored === "granted") {
      updateConsentGranted();
    }
    queueMicrotask(() => setConsent(stored));
  }, []);

  function handleAccept() {
    localStorage.setItem(CONSENT_KEY, "granted");
    updateConsentGranted();
    window.dispatchEvent(new Event(CONSENT_EVENT));
    setConsent("granted");
  }

  function handleDecline() {
    localStorage.setItem(CONSENT_KEY, "denied");
    updateConsentDenied();
    window.dispatchEvent(new Event(CONSENT_EVENT));
    setConsent("denied");
  }

  // Don't render if user already made a choice
  if (!mounted || consent !== null) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[1000] flex justify-center px-4 pb-[max(16px,env(safe-area-inset-bottom))] md:pb-[max(24px,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-modal="false"
      aria-label={t("dialogAria")}
    >
      <div className="pointer-events-auto w-full max-w-[720px] bg-white border border-[#E5E7EB] rounded-[16px] shadow-[0_12px_40px_rgba(32,36,39,0.2)] px-[16px] py-[12px] md:px-[24px] md:py-[14px] flex flex-col md:flex-row items-start md:items-center gap-[10px] md:gap-[16px]">
        {/* Text */}
        <p className="font-body text-[14px] text-[#5A524C] leading-[160%] flex-1">
          {t("message")}{" "}
          <Link
            href="/cookies"
            className="text-brand-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            {t("googleAnalytics")}
          </Link>
          . {t("noDataSold")}{" "}
          <Link
            href="/cookies"
            className="text-brand-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            {t("learnMore")}
          </Link>
          .
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-[10px] shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={handleDecline}
            aria-label={t("declineAria")}
            className="flex-1 md:flex-none rounded-[10px] border border-[#D1D5DB] px-[16px] py-[9px] font-body font-medium text-[14px] text-[#374151] hover:border-[#9CA3AF] transition-colors"
          >
            {t("decline")}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            aria-label={t("acceptAria")}
            className="flex-1 md:flex-none rounded-[10px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white px-[16px] py-[9px] font-body font-medium text-[14px] hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
