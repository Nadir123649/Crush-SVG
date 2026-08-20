import React from "react";
import Image from "next/image";
import { IMAGES } from "@/lib/shared/images";

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
    <section id="how-it-works" className="w-full flex flex-col items-center mb-[60px] md:mb-[100px] scroll-mt-[120px] md:scroll-mt-[180px]">
      {/* Heading */}
      <h2 className="font-heading font-semibold text-[24px] leading-[30px] md:text-[48px] md:leading-[61px] tracking-[0.04em] text-center text-text-dark max-w-[361px] md:max-w-[807px]">
        One File. <span className="text-[#D94A1E]">Three Simple Steps.</span>
      </h2>

      {/* Steps Container */}
      <div className="w-full max-w-[1044px] flex flex-col md:flex-row justify-center items-center gap-[30px] md:gap-[40px] mt-[30px] md:mt-[60px]">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center text-center gap-[10px] md:gap-[14px] flex-1 w-full max-w-[320px]">
            <Image 
              src={step.icon} 
              alt={step.title} 
              width={80} 
              height={80} 
              className="object-contain w-[80px] h-[80px] md:w-[104px] md:h-[104px]"
            />
            <h3 className="font-heading font-medium text-[20px] md:text-[24px] leading-[24px] md:leading-[18.67px] text-text-dark mt-[4px]">
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
