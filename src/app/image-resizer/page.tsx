import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { ImageResizer } from "@/components/sections/ImageResizer";
import { Features } from "@/components/sections/Features";
import { SignUpCTA } from "@/components/sections/SignUpCTA";
import { StepsSection } from "@/components/sections/StepsSection";
import { FAQ } from "@/components/sections/FAQ";

export const metadata: Metadata = constructMetadata({
  title: "Image Resizer – Free Online Image Resizing Tool",
  description:
    "Resize images instantly. Free, browser-based, supports PNG, JPG, and WebP. Adjust width, height, scale, and quality. No install needed.",
  canonicalPath: "/image-resizer",
  image: "/opengraph-image",
  keywords: [
    "crush svg",
    "image resizer",
    "resize image",
    "image resize online",
    "resize png",
    "resize jpg",
    "resize webp",
    "free image resizer",
    "online image resizer",
    "scale image",
    "change image size",
    "make image smaller",
    "enlarge image",
  ],
});

export default function ImageResizerPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <Hero
        title={
          <>
            <span className="text-brand-primary">Resize Images</span>
            <br className="hidden md:inline" /> Instantly
          </>
        }
        subtitle="Upload any image and resize it in seconds. Free, private, and runs entirely in your browser. Supports PNG, JPG, and WebP."
      />
      <ImageResizer />
      <Features mode="image-resizer" />
      <SignUpCTA />
      <StepsSection mode="image-resizer" />
      <FAQ mode="image-resizer" />
    </div>
  );
}
