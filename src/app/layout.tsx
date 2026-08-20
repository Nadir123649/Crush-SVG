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
import "./globals.css";

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
      </body>
    </html>
  );
}
