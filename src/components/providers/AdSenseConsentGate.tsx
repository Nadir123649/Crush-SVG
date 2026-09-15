"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "crush_cookie_consent";
const CONSENT_EVENT = "crushConsentChanged";
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-2946217028626519";

export function AdSenseConsentGate() {
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

  useEffect(() => {
    if (!granted) return;
    if (document.querySelector('script[src*="pagead2.googlesyndication.com"]')) return;

    const script = document.createElement("script");
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    script.async = true;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  }, [granted]);

  return null;
}
