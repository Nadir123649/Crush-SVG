import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Afacad } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { Header } from "@/components/layout/Header";
import { ScrollToTop } from "@/components/utils/ScrollToTop";
import { Footer } from "@/components/sections/Footer";
import { AuthProvider } from "@/lib/client/auth-context";
import { constructMetadata, getOrganizationSchema, getWebApplicationSchema } from "@/lib/seo";
import Script from "next/script";
import { CookieConsentBanner } from "@/components/ui/CookieConsentBanner";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-VCLLSKB082";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const afacad = Afacad({
  variable: "--font-afacad",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#D94A1E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = constructMetadata({
  title: "CrushSVG | Convert SVG to PNG Exactly as Intended",
  description: "Paste your SVG code, upload a file, or drag and drop it. Generate crisp PNGs in seconds for Outlook, Gmail, newsletters, websites, and more.",
  canonicalPath: "/",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${afacad.variable} h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col items-center bg-background overflow-x-hidden" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getOrganizationSchema()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getWebApplicationSchema()) }}
        />
        <AuthProvider>
          <Header />
          <ScrollToTop />
          <div className="w-full max-w-[1440px] mx-auto px-[16px] md:px-[80px] flex flex-col flex-1">
            <main className="w-full flex-1">
              {children}
            </main>
          </div>
          <Footer />
        </AuthProvider>
        <ToastProvider />
        <Analytics />
        <SpeedInsights />
        {/* GDPR: default consent denied — must run before GA4 config */}
        <Script id="consent-default" strategy="beforeInteractive">
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
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        {/* Cookie consent banner — shown until user accepts/declines */}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
