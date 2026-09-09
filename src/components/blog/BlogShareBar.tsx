"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";

interface BlogShareBarProps {
  title: string;
  url: string;
}

export function BlogShareBar({ title, url }: BlogShareBarProps) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("blog");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const shareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      title
    )}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  };

  const shareLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      url
    )}`;
    window.open(linkedInUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider mr-1">
        {t("shareLabel")}
      </span>
      <button
        onClick={shareTwitter}
        aria-label={t("shareOnX")}
        className="w-8 h-8 rounded-full bg-[#F5F2EF] hover:bg-[#EBE5E0] text-text-dark flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
      >
        𝕏
      </button>
      <button
        onClick={shareLinkedIn}
        aria-label={t("shareOnLinkedIn")}
        className="w-8 h-8 rounded-full bg-[#F5F2EF] hover:bg-[#EBE5E0] text-brand-primary flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
      >
        in
      </button>
      <button
        onClick={handleCopy}
        aria-label={t("copyLink")}
        className="px-2.5 h-8 rounded-full bg-[#F5F2EF] hover:bg-[#EBE5E0] text-text-dark flex items-center gap-1 transition-colors cursor-pointer text-xs font-medium"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <span>{copied ? t("linkCopied") : t("copyLink")}</span>
      </button>
    </div>
  );
}
