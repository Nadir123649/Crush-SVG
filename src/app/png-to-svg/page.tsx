import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { ConverterUI } from "@/components/sections/ConverterUI";
import { Features } from "@/components/sections/Features";
import { SignUpCTA } from "@/components/sections/SignUpCTA";
import { StepsSection } from "@/components/sections/StepsSection";
import { TargetAudience } from "@/components/sections/TargetAudience";
import { FAQ } from "@/components/sections/FAQ";

export const metadata: Metadata = constructMetadata({
  title: "PNG to SVG Converter – Free Image to Vector Online",
  description: "Convert PNG, JPG, and JPEG images to scalable SVG vectors in seconds. Free, browser-based. No install needed.",
  canonicalPath: "/png-to-svg",
  image: "/opengraph-image",
  keywords: [
    "crush svg",
    "png to svg",
    "jpg to svg",
    "convert image to vector",
    "image to svg converter",
    "online png to svg",
    "free vector converter",
    "image vectorizer",
    "raster to vector",
  ],
});

export default function PngToSvg() {
  return (
    <div className="w-full flex flex-col items-center">
      <Hero 
        title={<>From <span className="text-brand-primary">PNG to SVG,</span> Exactly<br className="hidden md:inline" /> as Intended</>} 
        subtitle="Turn your raster images into perfectly scalable SVG vectors instantly." 
      />
      <ConverterUI mode="raster-to-svg" />
      <Features mode="raster-to-svg" />
      <SignUpCTA />
      <StepsSection mode="raster-to-svg" />
      <TargetAudience />
      <FAQ mode="raster-to-svg" />
    </div>
  );
}
