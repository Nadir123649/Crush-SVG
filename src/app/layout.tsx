import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Afacad, Noto_Sans_JP } from "next/font/google";
import { AppFeedbackProvider } from "@/components/providers/AppFeedbackProvider";
import { AnalyticsConsentGate } from "@/components/providers/AnalyticsConsentGate";
import { AdSenseConsentGate } from "@/components/providers/AdSenseConsentGate";
import { AuthProvider } from "@/lib/client/auth-context";
import {
  constructMetadata,
  getOrganizationSchema,
  getWebApplicationSchema,
  getWebSiteSchema,
} from "@/lib/seo";
import Script from "next/script";
import { CookieConsentBanner } from "@/components/ui/CookieConsentBanner";
import { ServiceWorkerRegistration } from "@/components/utils/ServiceWorkerRegistration";
import { ClientLayoutWrapper } from "@/components/layout/ClientLayoutWrapper";
import { getSiteSettings } from "@/lib/data/settings";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import fallbackMessages from "../../messages/en.json";
import "./globals.css";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-KK3N72HS";
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-2946217028626519";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const afacad = Afacad({
  variable: "--font-afacad",
  subsets: ["latin"],
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  preload: false,
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#D94A1E",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = constructMetadata({
  title: "CrushSVG – Free SVG to PNG Converter Online",
  description:
    "Paste SVG code or upload a file. Get crisp, high-res PNGs in seconds. Free, browser-based, transparent background support.",
  canonicalPath: "/",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let logoUrl: string | undefined;
  try {
    logoUrl = (await getSiteSettings()).logoUrl;
  } catch {
    // Ignore db fetch error
  }

  const locale = (await getLocale().catch(() => "en")) || "en";
  const messages = await getMessages().catch(() => fallbackMessages);

  return (
    <html
      lang={locale}
      className={`${bricolage.variable} ${afacad.variable} ${notoSansJP.variable} h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head suppressHydrationWarning>
        {/* ── Auth class sync: set BEFORE <body> paints so CSS hides the
            wrong auth panel on the very first frame. Reads the same
            localStorage key AuthProvider uses — no second auth system. */}
        <Script
          id="auth-sync"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{var u=localStorage.getItem('crush_user');document.documentElement.classList.add(u?'user-logged-in':'user-logged-out')}catch(e){document.documentElement.classList.add('user-logged-out')}`,
          }}
        />

        {/* Google Search Console */}
        <meta
          name="google-site-verification"
          content="4g9Z_Bp03i6CKz3fw8qNFHYNDOfQM-Pgk9V4iGpX-cg"
        />

        {/* Bing Webmaster Tools */}
        <meta
          name="msvalidate.01"
          content="68434D213B77FA63AE8FFAA76729DCEE"
        />

        {/* Google AdSense account verification */}
        <meta
          name="google-adsense-account"
          content={ADSENSE_CLIENT}
        />

        {/* Font Connections */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* Google Tag Manager DNS */}
        <link
          rel="dns-prefetch"
          href="https://www.googletagmanager.com"
        />

        {/* Google Tag Manager */}
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            (function(w,d,s,l,i){
              w[l]=w[l]||[];
              w[l].push({
                'gtm.start': new Date().getTime(),
                event:'gtm.js'
              });
              var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),
                  dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;
              j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `}}
        />

        {/* Consent Mode v2 default must run before GTM tags are evaluated. */}
        <Script
          id="consent-default"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'wait_for_update': 500
              });
            `,
          }}
        />

        {/* LLMs.txt for AI Search Engine Optimization (GEO) */}
        <link
          rel="alternate"
          type="text/plain"
          href="/llms.txt"
          title="LLM Context"
        />

      </head>

      <body
        className="min-h-full flex flex-col items-center bg-background overflow-x-hidden"
        suppressHydrationWarning
      >
        {/* Structured Data (JSON-LD) - in body to avoid hydration mismatch from browser extensions injecting scripts in head */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getWebSiteSchema()),
          }}
        />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getOrganizationSchema()),
          }}
        />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getWebApplicationSchema()),
          }}
        />

        {/* Google Tag Manager - noscript */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{
              display: "none",
              visibility: "hidden",
            }}
          />
        </noscript>

        {/* Skip to main content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none font-body font-medium transition-all"
        >
          Skip to main content
        </a>

        <AppFeedbackProvider>
          <AuthProvider>
            <NextIntlClientProvider locale={locale} messages={messages}>
              <ClientLayoutWrapper logoUrl={logoUrl}>
                {children}
              </ClientLayoutWrapper>
              {/* Cookie Consent Banner - inside NextIntlClientProvider for useTranslations */}
              <CookieConsentBanner />
            </NextIntlClientProvider>
          </AuthProvider>
        </AppFeedbackProvider>

        <AnalyticsConsentGate />
        <AdSenseConsentGate />

        {/* Service Worker */}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}