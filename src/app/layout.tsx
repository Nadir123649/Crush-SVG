import type { Metadata } from "next";
import { Bricolage_Grotesque, Afacad } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthProvider } from "@/lib/client/auth-context";
import { ToastProvider } from "@/components/ui/ToastProvider";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const afacad = Afacad({
  variable: "--font-afacad",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://crush-svg.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CrushSVG | Convert SVG to PNG Exactly as Intended",
  description: "Paste your SVG code, upload a file, or drag and drop it. Generate crisp PNGs in seconds for Outlook, Gmail, newsletters, websites, and more.",
  icons: {
    icon: "/CrushSVG-logo.svg",
  },
  openGraph: {
    title: "CrushSVG | Convert SVG to PNG Exactly as Intended",
    description: "Paste your SVG code, upload a file, or drag and drop it. Generate crisp PNGs in seconds for Outlook, Gmail, newsletters, websites, and more.",
    type: "website",
    images: ["/CrushSVG-logo.svg"],
  },
  twitter: {
    card: "summary",
    title: "CrushSVG | Convert SVG to PNG Exactly as Intended",
    description: "Paste your SVG code, upload a file, or drag and drop it. Generate crisp PNGs in seconds for Outlook, Gmail, newsletters, websites, and more.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${afacad.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col items-center bg-background" suppressHydrationWarning>
        <ToastProvider>
          <AuthProvider>
            <Navbar />
            <div className="w-full max-w-[1440px] mx-auto px-[16px] md:px-[80px] flex flex-col flex-1">
              <main className="w-full flex-1">
                {children}
              </main>
            </div>
            <Footer />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
