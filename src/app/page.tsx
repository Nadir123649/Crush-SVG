import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { ConverterUI } from "@/components/sections/ConverterUI";
import { AdBanner } from "@/components/ui/AdBanner";
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
      <AdBanner />
      <Features />
      <SignUpCTA />
      <StepsSection />
      <TargetAudience />
      <FAQ />
    </div>
  );
}
