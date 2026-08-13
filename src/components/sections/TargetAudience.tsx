import React from "react";
import Image from "next/image";
import { IMAGES } from "@/lib/images";

export function TargetAudience() {
  const cards = [
    {
      icon: IMAGES.message,
      title: "Email Developers",
      description: "Convert SVG logos and icons into reliable PNGs that render consistently across Outlook, Gmail.",
    },
    {
      icon: IMAGES.marketing,
      title: "Marketers",
      description: "Deliver polished, campaign-ready visuals in seconds with high-quality PNGs built for newsletters, landing pages and more.",
    },
    {
      icon: IMAGES.agencies,
      title: "Agencies",
      description: "Deliver client-ready PNG exports in seconds without the hassle of opening Figma, Illustrator, or Photoshop.",
    },
    {
      icon: IMAGES.designers,
      title: "UI Designers",
      description: "Preview exactly how your icons and graphics will look as PNGs before handing them off to developers.",
    },
  ];

  return (
    <section className="w-full flex flex-col items-center mb-[100px] mt-[30px]">
      {/* Heading */}
      <h2 className="font-heading font-semibold text-[48px] leading-[61px] tracking-[0.04em] text-center text-text-dark mb-[60px]">
        Made For People <span className="text-brand-primary">Who Ship</span>
      </h2>

      {/* Cards Container */}
      <div className="w-full max-w-[1280px] grid grid-cols-4 gap-[40px]">
        {cards.map((card, index) => (
          <div 
            key={index} 
            className="flex flex-col w-full bg-white rounded-[24px] border border-[#F4F4F4] p-[24px] transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(217,74,30,0.2)] hover:-translate-y-2 cursor-pointer"
          >
            {/* Image Box */}
            <div className="w-full h-[120px] rounded-[12px] bg-[#FCF1ED] flex items-center justify-center">
              <Image 
                src={card.icon} 
                alt={card.title} 
                width={32} 
                height={32} 
                className="object-contain"
              />
            </div>

            {/* Text Content */}
            <h3 className="font-heading font-semibold text-[20px] leading-[26px] tracking-[0.04em] text-text-dark mt-[20px] whitespace-nowrap">
              {card.title}
            </h3>
            <p className="font-body font-normal text-[14px] leading-[20px] text-[#8F9094] mt-[10px]">
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
