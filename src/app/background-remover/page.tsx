import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { BackgroundRemover } from "@/components/sections/BackgroundRemover";
import { Features } from "@/components/sections/Features";
import { SignUpCTA } from "@/components/sections/SignUpCTA";
import { StepsSection } from "@/components/sections/StepsSection";
import { FAQ } from "@/components/sections/FAQ";

export const metadata: Metadata = constructMetadata({
  title: "Background Remover – Free AI Image Background Removal Online",
  description:
    "Remove image backgrounds instantly. Free, browser-based, transparent output. No install needed.",
  canonicalPath: "/background-remover",
  image: "/opengraph-image",
  keywords: [
    "crush svg",
    "background remover",
    "remove background",
    "image background removal",
    "transparent background",
    "free background remover",
    "online background remover",
    "AI background removal",
    "remove image background",
    "photo background remover",
    "cut out image",
    "transparent png",
  ],
});

export default function BackgroundRemoverPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <Hero
        title={
          <>
            <span className="text-brand-primary">Remove Backgrounds</span>
            <br className="hidden md:inline" /> Instantly
          </>
        }
        subtitle="Upload any image and get a clean, transparent background in seconds. Free, private, and runs entirely in your browser."
      />
      <BackgroundRemover />
      <Features mode="background-remover" />
      <SignUpCTA />
      <StepsSection mode="background-remover" />
      <FAQ mode="background-remover" />
    </div>
  );
}
