"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/client/auth-context";

export function AdBanner() {
  const { status } = useAuth();
  const adRef = useRef<HTMLModElement>(null);
  const adInitialized = useRef(false);

  useEffect(() => {
    // Only initialize ad for guest (non-authed) users
    if (status !== "guest") return;
    if (adInitialized.current) return;

    // Do not execute AdSense script on localhost/dev to prevent unapproved domain & zero-width TagErrors
    if (
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        process.env.NODE_ENV !== "production")
    ) {
      adInitialized.current = true;
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const pushAd = () => {
      const insEl = adRef.current;
      if (!insEl) return;

      // Skip if already initialized by AdSense
      if (insEl.getAttribute("data-adsbygoogle-status") === "done") {
        adInitialized.current = true;
        return;
      }

      // If container hasn't painted with width > 0, wait for next cycle
      if (insEl.offsetWidth === 0) {
        timeoutId = setTimeout(pushAd, 150);
        return;
      }

      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adInitialized.current = true;
      } catch {
        // Silently catch so it never surfaces as an unhandled TagError overlay
      }
    };

    const rafId = requestAnimationFrame(pushAd);

    return () => {
      cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [status]);

  // While auth state is loading, render nothing to prevent layout flash
  if (status === "loading") return null;

  // Logged-in users: no ad shown
  if (status === "authed") return null;

  // Development environment: clean dashed placeholder so dev overlay is never triggered
  if (process.env.NODE_ENV !== "production") {
    return (
      <div className="w-full max-w-[1280px] mx-auto my-[24px] md:my-[40px] flex justify-center items-center overflow-hidden min-h-[90px] border border-dashed border-[#EAEAEA] rounded-xl bg-[#FAF6F3]/50 text-text-muted text-xs select-none">
        AdSense Banner Slot (Active on Production)
      </div>
    );
  }

  // Guest users on production: render actual Google AdSense unit
  return (
    <div className="w-full max-w-[1280px] mx-auto my-[24px] md:my-[40px] flex justify-center items-center overflow-hidden min-h-[100px] bg-transparent">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", minWidth: "250px", width: "100%" }}
        data-ad-client="ca-pub-2946217028626519"
        data-ad-slot="4767575045"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
