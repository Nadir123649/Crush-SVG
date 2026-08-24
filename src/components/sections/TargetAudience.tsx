import React from "react";
import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/shared/images";

export function TargetAudience() {
  const cards = [
    {
      icon: IMAGES.message,
      title: "Email Developers",
      description: "Convert SVG logos and icons into reliable PNGs that render consistently across Outlook, Gmail.",
      href: "/svg-guides#svg-to-png-email",
      linkText: "Read Email SVG Guide",
    },
    {
      icon: IMAGES.marketing,
      title: "Marketers",
      description: "Deliver polished, campaign-ready visuals in seconds with high-quality PNGs built for newsletters, landing pages and more.",
      href: "/svg-guides",
      linkText: "Explore Best Practices",
    },
    {
      icon: IMAGES.agencies,
      title: "Agencies",
      description: "Deliver client-ready PNG exports in seconds without the hassle of opening Figma, Illustrator, or Photoshop.",
      href: "/#converter",
      linkText: "Convert Assets Fast",
    },
    {
      icon: IMAGES.designers,
      title: "UI Designers",
      description: "Preview exactly how your icons and graphics will look as PNGs before handing them off to developers.",
      href: "/svg-guides#figma-svg-to-transparent-png",
      linkText: "Figma Export Guide",
    },
  ];

  return (
    <section className="w-full flex flex-col items-center mb-[60px] md:mb-[100px] mt-[20px] md:mt-[30px]">
      {/* Heading */}
      <h2 className="font-heading font-semibold text-[24px] leading-[30px] md:text-[48px] md:leading-[61px] tracking-[0.04em] text-center text-text-dark mb-[30px] md:mb-[60px]">
        Made For People <span className="text-brand-primary">Who Ship</span>
      </h2>

      {/* Cards Container */}
      <div className="w-full max-w-[360px] md:max-w-[720px] lg:max-w-[1280px] flex flex-col md:grid md:grid-cols-2 lg:grid-cols-4 gap-[16px] md:gap-[40px]">
        {cards.map((card, index) => (
          <Link
            href={card.href}
            key={index} 
            aria-label={card.linkText}
            className="flex flex-row md:flex-col w-full bg-white rounded-[12px] md:rounded-[24px] border border-[#F4F4F4] p-[10px] md:p-[24px] gap-[12px] md:gap-0 transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(217,74,30,0.2)] hover:-translate-y-2 cursor-pointer items-center md:items-stretch group"
          >
            {/* Image Box */}
            <div className="w-[155px] h-[140px] md:w-full md:h-[120px] rounded-[12px] bg-[#FCF1ED] flex items-center justify-center shrink-0">
              <Image 
                src={card.icon} 
                alt={card.title} 
                width={32} 
                height={32} 
                className="object-contain"
              />
            </div>

            {/* Text Content */}
            <div className="flex flex-col justify-center gap-[8px] w-full min-w-0">
              <h3 className="font-heading font-semibold text-[18px] md:text-[20px] leading-[22px] md:leading-[26px] tracking-[0.04em] text-text-dark mt-0 md:mt-[20px] group-hover:text-brand-primary transition-colors">
                {card.title}
              </h3>
              <p className="font-body font-normal text-[14px] md:text-[14px] leading-[18.67px] md:leading-[20px] text-text-muted">
                {card.description}
              </p>
              <span className="text-xs font-semibold text-brand-primary mt-1 hidden md:inline-flex items-center gap-1 group-hover:underline">
                {card.linkText} &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
