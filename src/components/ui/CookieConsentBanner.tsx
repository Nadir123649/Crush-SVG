"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { updateConsentGranted } from "@/lib/client/analytics";

const CONSENT_KEY = "crush_cookie_consent";

type ConsentValue = "granted" | "denied" | null;

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<ConsentValue | "loading">("loading");

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY) as ConsentValue | null;
    // If previously granted, immediately fire consent update for this session
    if (stored === "granted") {
      updateConsentGranted();
    }
    setConsent(stored);
  }, []);

  function handleAccept() {
    localStorage.setItem(CONSENT_KEY, "granted");
    updateConsentGranted();
    setConsent("granted");
  }

  function handleDecline() {
    localStorage.setItem(CONSENT_KEY, "denied");
    setConsent("denied");
  }

  // Don't render during SSR or if user already made a choice
  if (consent !== null) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 md:pb-6"
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
    >
      <div className="w-full max-w-[720px] bg-white border border-[#E5E7EB] rounded-[16px] shadow-lg px-[20px] py-[16px] md:px-[28px] md:py-[18px] flex flex-col md:flex-row items-start md:items-center gap-[14px] md:gap-[20px]">
        {/* Text */}
        <p className="font-body text-[14px] text-[#5A524C] leading-[160%] flex-1">
          We use cookies to improve your experience and track anonymous usage via{" "}
          <Link
            href="/cookies"
            className="text-brand-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            Google Analytics
          </Link>
          . No personal data is sold.{" "}
          <Link
            href="/cookies"
            className="text-brand-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            Learn more
          </Link>
          .
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-[10px] shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={handleDecline}
            className="flex-1 md:flex-none rounded-[10px] border border-[#D1D5DB] px-[16px] py-[9px] font-body font-medium text-[14px] text-[#5A524C] hover:border-[#9CA3AF] transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 md:flex-none rounded-[10px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white px-[16px] py-[9px] font-body font-medium text-[14px] hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
