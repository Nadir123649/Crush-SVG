import React from "react";
import Image from "next/image";
import { IMAGES } from "@/lib/images";

export function StepsSection() {
  const steps = [
    {
      icon: IMAGES.uploadImage,
      title: "Paste or Upload",
      description: "Drop your SVG file or paste standard markup directly into the field.",
    },
    {
      icon: IMAGES.exportIcon,
      title: "Choose Your Size",
      description: "Adjust width in pixels or simply scale it up for high-resolution output.",
    },
    {
      icon: IMAGES.downloadImage,
      title: "Download PNG",
      description: "Create sharp, transparent PNGs ready for anywhere.",
    },
  ];

  return (
    <section className="w-full flex flex-col items-center mb-[100px] mt-[10px]">
      {/* Heading */}
      <h2 className="font-heading font-semibold text-[48px] leading-[61px] tracking-[0.04em] text-center text-text-dark max-w-[807px]">
        One File. <span className="text-[#D94A1E]">Three Simple Steps.</span>
      </h2>

      {/* Steps Container */}
      <div className="w-full max-w-[1044px] flex justify-center gap-[40px] mt-[60px]">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center text-center gap-[14px] flex-1 max-w-[320px]">
            <Image 
              src={step.icon} 
              alt={step.title} 
              width={104} 
              height={104} 
              className="object-contain"
            />
            <h3 className="font-heading font-medium text-[24px] leading-[18.67px] text-text-dark mt-[4px]">
              {step.title}
            </h3>
            <p className="font-body font-normal text-[16px] leading-[18px] text-text-muted">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
