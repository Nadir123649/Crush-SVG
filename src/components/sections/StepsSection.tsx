import React from "react";
import Image from "next/image";
import { IMAGES } from "@/lib/shared/images";

export function StepsSection({ mode = "svg-to-png" }: { mode?: "svg-to-png" | "raster-to-svg" }) {
  const steps = [
    {
      icon: IMAGES.uploadImage,
      title: mode === "raster-to-svg" ? "Upload PNG/JPG" : "Paste or Upload",
      description: mode === "raster-to-svg" ? "Drop your raster image directly into the field to begin." : "Drop your SVG file or paste standard markup directly into the field.",
      imgClassName: "w-[60px] h-[60px] md:w-[95px] md:h-[95px]"
    },
    {
      icon: IMAGES.exportIcon,
      title: "Choose Your Size",
      description: "Adjust width in pixels or simply scale it up for high-resolution output.",
      imgClassName: "w-[80px] h-[80px] md:w-[104px] md:h-[104px]"
    },
    {
      icon: IMAGES.downloadImage,
      title: mode === "raster-to-svg" ? <>Download<br />SVG</> : <>Download<br />PNG</>,
      description: mode === "raster-to-svg" ? "Create crisp, perfectly scalable vectors ready for anywhere." : "Create sharp, transparent PNGs ready for anywhere.",
      imgClassName: "w-[80px] h-[80px] md:w-[104px] md:h-[104px]"
    },
  ];

  return (
    <section id="how-it-works" className="w-full flex flex-col items-center mb-[60px] md:mb-[100px] scroll-mt-[100px] md:scroll-mt-[140px]">
      {/* Heading */}
      <h2 className="font-heading font-semibold text-[24px] leading-[30px] md:text-[48px] md:leading-[61px] tracking-[0.04em] text-center text-text-dark max-w-[361px] md:max-w-[807px]">
        One File. <span className="text-[#D94A1E]">Three Simple Steps.</span>
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
