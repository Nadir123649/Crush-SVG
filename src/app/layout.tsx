import type { Metadata } from "next";
import { Bricolage_Grotesque, Afacad } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const afacad = Afacad({
  variable: "--font-afacad",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CrushSVG | Convert SVG to PNG Exactly as Intended",
  description: "Paste your SVG code, upload a file, or drag and drop it. Generate crisp PNGs in seconds for Outlook, Gmail, newsletters, websites, and more.",
  icons: {
    icon: "/CrushSVG-logo.svg",
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
        <div className="w-full max-w-[1440px] mx-auto px-[80px] flex flex-col">
          <Navbar />
          <main className="w-full flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
