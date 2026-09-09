"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const CONSENT_KEY = "crush_cookie_consent";
const CONSENT_EVENT = "crushConsentChanged";

export function AnalyticsConsentGate() {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    const syncConsent = () => {
      setGranted(localStorage.getItem(CONSENT_KEY) === "granted");
    };

    syncConsent();
    window.addEventListener(CONSENT_EVENT, syncConsent);
    window.addEventListener("storage", syncConsent);
    return () => {
      window.removeEventListener(CONSENT_EVENT, syncConsent);
      window.removeEventListener("storage", syncConsent);
    };
  }, []);

  if (!granted) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
