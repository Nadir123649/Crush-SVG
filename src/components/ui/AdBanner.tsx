"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/client/auth-context";

export function AdBanner() {
  const { status } = useAuth();
  const adInitialized = useRef(false);

  useEffect(() => {
    // Only initialize ad for guest (non-authed) users
    if (status !== "guest") return;
    // Prevent duplicate initialization in React strict mode / dev environment
    if (adInitialized.current) return;

    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      adInitialized.current = true;
    } catch (err) {
      console.error("AdSense initialization error:", err);
    }
  }, [status]);

  // While auth state is loading, render nothing to prevent layout flash
  if (status === "loading") return null;

  // Logged-in users: no ad shown
  if (status === "authed") return null;

  // Guest users: show the full ad unit
  return (
    <div className="w-full max-w-[1280px] mx-auto my-[24px] md:my-[40px] flex justify-center items-center overflow-hidden min-h-[100px] bg-transparent">
      {/* Google AdSense Unit: First Ad — shown to guest users only */}
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-2946217028626519"
        data-ad-slot="4767575045"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
