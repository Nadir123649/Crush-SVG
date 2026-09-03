import type { Metadata } from "next";
import Link from "next/link";
import { constructMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { ConverterUI } from "@/components/sections/ConverterUI";
import { Features } from "@/components/sections/Features";
import { SignUpCTA } from "@/components/sections/SignUpCTA";
import { StepsSection } from "@/components/sections/StepsSection";
import { TargetAudience } from "@/components/sections/TargetAudience";
import { FAQ } from "@/components/sections/FAQ";

export const metadata: Metadata = constructMetadata({
  title: "CrushSVG – Free SVG to PNG Converter Online",
  description: "Convert SVG to crisp PNG in seconds. Free, browser-based, transparent background support. No install needed.",
  canonicalPath: "/",
  image: "/opengraph-image",
  keywords: [
    "crush svg",
    "crushsvg",
    "crush svg converter",
    "svg to png",
    "convert svg to png",
    "svg to png converter",
    "online svg to png",
    "free svg converter",
    "svg to transparent png",
    "high resolution svg to png",
    "svg vector converter",
    "export svg as png",
    "svg to image converter online",
    "The Nevon",
  ],
});

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center">

      <Hero />
      <ConverterUI />
      <Features />
      <SignUpCTA />

      {/* Background Remover CTA */}
      <section className="w-full flex justify-center mb-[60px] md:mb-[100px]">
        <div className="w-full max-w-[361px] md:max-w-[900px] bg-[#FAF6F3] border border-[#EAEAEA] rounded-[16px] md:rounded-[24px] p-[24px] md:p-[48px] flex flex-col md:flex-row items-center gap-[24px] md:gap-[48px]">
          <div className="w-[60px] h-[60px] md:w-[80px] md:h-[80px] rounded-full bg-[#FCF1ED] flex items-center justify-center shrink-0">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-[28px] h-[28px] md:w-[32px] md:h-[32px]"
            >
              <path
                d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z"
                fill="#D94A1E"
              />
            </svg>
          </div>
          <div className="flex flex-col items-center md:items-start gap-[8px] text-center md:text-left">
            <h3 className="font-heading font-semibold text-[20px] md:text-[24px] leading-[26px] md:leading-[30px] tracking-[0.04em] text-text-dark">
              Need to remove an image{" "}
              <span className="text-[#DA582D]">background</span>?
            </h3>
            <p className="font-body font-normal text-[14px] md:text-[16px] leading-[18.67px] text-text-muted">
              Upload any photo and get a clean, transparent PNG in seconds. Free, private, no install needed.
            </p>
          </div>
          <Link
            href="/background-remover"
            className="shrink-0 inline-flex items-center justify-center h-[40px] md:h-[44px] px-[20px] md:px-[24px] rounded-[8px] bg-[#D94A1E] font-heading font-medium text-[14px] md:text-[16px] text-white tracking-[0.04em] hover:bg-[#c4411a] transition-colors"
          >
            Try Background Remover
          </Link>
        </div>
      </section>

      <StepsSection />
      <TargetAudience />
      <FAQ />
    </div>
  );
}
