import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Afacad } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { Header } from "@/components/layout/Header";
import { ScrollToTop } from "@/components/utils/ScrollToTop";
import { Footer } from "@/components/sections/Footer";
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
import "./globals.css";

const GA_MEASUREMENT_ID = "G-VCLLSKB082";
const GTM_ID = "GTM-KK3N72HS";
const ADSENSE_CLIENT = "ca-pub-2946217028626519";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${afacad.variable} h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        {/* Google Tag Manager */}
        <Script
          id="google-tag-manager"
          strategy="beforeInteractive"
        >
          {`
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
          `}
        </Script>

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

        {/* Google AdSense */}
        <Script
          id="google-adsense"
          strategy="afterInteractive"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />

        {/* Website Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getWebSiteSchema()),
          }}
        />

        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getOrganizationSchema()),
          }}
        />

        {/* Web Application Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getWebApplicationSchema()),
          }}
        />
      </head>

      <body
        className="min-h-full flex flex-col items-center bg-background overflow-x-hidden"
        suppressHydrationWarning
      >
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

        <AuthProvider>
          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
        </AuthProvider>

        <ToastProvider />

        <Analytics />

        <SpeedInsights />

        {/* GDPR: Default consent denied — must run before GA4 config */}
        <Script
          id="consent-default"
          strategy="beforeInteractive"
        >
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              wait_for_update: 500
            });
          `}
        </Script>

        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />

        <Script
          id="google-analytics"
          strategy="afterInteractive"
        >
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>

        {/* Cookie Consent Banner */}
        <CookieConsentBanner />

        {/* Service Worker */}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}