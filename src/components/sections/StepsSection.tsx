import React from "react";
import Image from "next/image";
import { IMAGES } from "@/lib/shared/images";
import { getHowToSchema } from "@/lib/seo";
import { useTranslations } from "next-intl";

export function StepsSection({ mode = "svg-to-png" }: { mode?: "svg-to-png" | "raster-to-svg" | "background-remover" | "image-resizer" }) {
  const t = useTranslations("steps");

  const icons = [IMAGES.uploadImage, IMAGES.exportIcon, IMAGES.downloadImage];
  const imgClasses = [
    "w-[60px] h-[60px] md:w-[95px] md:h-[95px]",
    "w-[80px] h-[80px] md:w-[104px] md:h-[104px]",
    "w-[80px] h-[80px] md:w-[104px] md:h-[104px]"
  ];

  let stepData: { title: string; description: string }[] = [];
  try {
    const rawKey = mode === "background-remover" ? "bg" : mode === "image-resizer" ? "resizer" : mode === "raster-to-svg" ? "raster" : "svg";
    const rawSteps = t.raw(rawKey) as { title: string; description: string }[];
    if (Array.isArray(rawSteps)) {
      stepData = rawSteps;
    }
  } catch {
    // fallback
  }

  const steps = stepData.length === 3 ? stepData.map((item, idx) => ({
    icon: icons[idx],
    title: item.title,
    description: item.description,
    imgClassName: imgClasses[idx]
  })) : (mode === "background-remover" ? [
    {
      icon: IMAGES.uploadImage,
      title: "Upload Your Image",
      description: "Drop your photo or paste from clipboard. Supports PNG, JPG, and WebP up to 10MB.",
      imgClassName: "w-[60px] h-[60px] md:w-[95px] md:h-[95px]"
    },
    {
      icon: IMAGES.exportIcon,
      title: "Remove Background",
      description: "Click one button and watch the background disappear instantly.",
      imgClassName: "w-[80px] h-[80px] md:w-[104px] md:h-[104px]"
    },
    {
      icon: IMAGES.downloadImage,
      title: "Download Result",
      description: "Get a clean, transparent PNG ready for any project or platform.",
      imgClassName: "w-[80px] h-[80px] md:w-[104px] md:h-[104px]"
    },
  ] : [
    {
      icon: IMAGES.uploadImage,
      title: mode === "raster-to-svg" ? "Upload PNG or JPG" : "Paste or Upload",
      description: mode === "raster-to-svg" ? "Drop your raster image or paste from clipboard directly into the converter." : "Drop your SVG file or paste standard markup directly into the field.",
      imgClassName: "w-[60px] h-[60px] md:w-[95px] md:h-[95px]"
    },
    {
      icon: IMAGES.exportIcon,
      title: mode === "raster-to-svg" ? "Tune Vector Settings" : "Choose Your Size",
      description: mode === "raster-to-svg" ? "Adjust quality, color palette, and path smoothing for clean vector curves." : "Adjust width in pixels or simply scale it up for high-resolution output.",
      imgClassName: "w-[80px] h-[80px] md:w-[104px] md:h-[104px]"
    },
    {
      icon: IMAGES.downloadImage,
      title: mode === "raster-to-svg" ? "Download SVG" : "Download PNG",
      description: mode === "raster-to-svg" ? "Get clean, infinitely scalable vector SVG paths ready for any project." : "Create sharp, transparent PNGs ready for anywhere.",
      imgClassName: "w-[80px] h-[80px] md:w-[104px] md:h-[104px]"
    },
  ]);

  const howToTitle = mode === "background-remover" 
    ? "How to Remove Image Background Online" 
    : mode === "image-resizer" 
    ? "How to Resize Images Online" 
    : mode === "raster-to-svg" 
    ? "How to Convert Raster Images to SVG Vector" 
    : "How to Convert SVG to PNG Online";

  const howToDescription = mode === "background-remover"
    ? "Remove background from photos in three simple steps."
    : mode === "image-resizer"
    ? "Resize PNG, JPG, and WebP images in seconds."
    : mode === "raster-to-svg"
    ? "Convert PNG or JPG raster images into scalable SVG vectors."
    : "Convert SVG code or files into crisp transparent PNG images in three steps.";

  const schemaSteps = steps.map((s) => ({
    name: s.title,
    text: s.description,
  }));

  return (
    <section id="how-it-works" className="w-full flex flex-col items-center mb-[60px] md:mb-[100px] scroll-mt-[100px] md:scroll-mt-[140px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getHowToSchema(howToTitle, howToDescription, schemaSteps)),
        }}
      />

      {/* Heading */}
      <h2 className="font-heading font-semibold text-[24px] leading-[30px] md:text-[48px] md:leading-[61px] tracking-[0.04em] text-center text-text-dark max-w-[361px] md:max-w-[807px]">
        {mode === "background-remover" ? (
          <>One Image. <span className="text-[#D94A1E]">Three Simple Steps.</span></>
        ) : mode === "image-resizer" ? (
          <>One Image. <span className="text-[#D94A1E]">Perfectly Sized.</span></>
        ) : (
          <>One File. <span className="text-[#D94A1E]">Three Simple Steps.</span></>
        )}
      </h2>

      {/* Steps Container */}
      <div className="w-full max-w-[1044px] grid grid-cols-1 md:grid-cols-3 gap-[40px] mt-[40px] md:mt-[60px] px-[16px] md:px-[0px]">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center text-center gap-[10px] md:gap-[14px] w-full mx-auto max-w-[320px]">
            <div className="flex flex-col items-center justify-end h-[80px] md:h-[104px]">
              <Image 
                src={step.icon} 
                alt={typeof step.title === 'string' ? step.title : "Step"} 
                width={104} 
                height={104} 
                className={`object-contain ${step.imgClassName}`}
              />
            </div>
            <h3 className="font-heading font-medium text-[20px] md:text-[24px] leading-[1.2] text-text-dark mt-[4px] h-[48px] md:h-[60px] flex flex-col justify-center text-center w-full">
              {step.title}
            </h3>
            <p className="font-body font-normal text-[14px] md:text-[16px] leading-[18px] text-text-muted">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

