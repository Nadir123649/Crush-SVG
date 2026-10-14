import React from "react";
import type { Metadata } from "next";
import { Link } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Offline | CrushSVG",
  description: "You are currently browsing CrushSVG in offline mode.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] py-[60px] px-[24px] text-center">
      <div className="w-[68px] h-[68px] rounded-[18px] bg-[#FFF1EB] border border-[#F0C9B9] flex items-center justify-center mb-[20px] text-brand-primary">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
        </svg>
      </div>

      <h1 className="font-heading font-bold text-[28px] md:text-[36px] text-text-dark mb-[10px]">
        You are currently offline
      </h1>
      <p className="font-body text-[15px] md:text-[16px] text-text-muted max-w-[460px] mb-[28px] leading-[1.6]">
        No internet connection detected. In-browser client conversions for cached vector files remain active without a network.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[340px]">
        <Link
          href="/"
          className="flex-1 h-[44px] rounded-[10px] bg-brand-primary text-white font-heading font-medium text-[15px] flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          Return to Converter
        </Link>
      </div>
    </div>
  );
}
