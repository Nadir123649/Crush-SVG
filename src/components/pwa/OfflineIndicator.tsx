"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function OfflineIndicator() {
  const t = useTranslations("pwa");
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    // Check initial status
    if (!navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline && !showReconnected) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[99] px-4 py-2 rounded-full shadow-[0px_8px_24px_rgba(0,0,0,0.18)] transition-all duration-300 animate-slideUp flex items-center gap-2.5 backdrop-blur-md border text-[13px] font-body font-medium"
      style={{
        backgroundColor: isOffline ? "rgba(35, 38, 41, 0.95)" : "rgba(16, 120, 70, 0.95)",
        borderColor: isOffline ? "rgba(217, 74, 30, 0.4)" : "rgba(52, 211, 153, 0.4)",
        color: "#FFFFFF",
      }}
    >
      {isOffline ? (
        <>
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF7A45] animate-pulse shrink-0" />
          <span>{t("offlineMode")}</span>
        </>
      ) : (
        <>
          <span className="w-2.5 h-2.5 rounded-full bg-[#34D399] shrink-0" />
          <span>{t("backOnline")}</span>
        </>
      )}
    </div>
  );
}
