"use client";
import React from "react";
import { useAuth } from "@/lib/client/auth-context";

export function Hero() {
  const { status } = useAuth();

  return (
    <section id="hero" className="flex flex-col items-center w-full max-w-[361px] md:max-w-[795px] mx-auto mt-[30px] md:mt-[54px] gap-[16px] md:gap-[14px]">
      
      {/* Badge */}
      <div 
        style={{ 
          border: "1px solid transparent",
          background: "linear-gradient(#FFFCFA, #FFFCFA) padding-box, linear-gradient(to right, #D94A1E, #FF9A3D) border-box"
        }}
        className={`flex items-center gap-[6px] md:gap-[10px] h-[24px] md:h-[29px] rounded-[30px] px-[12px] md:px-[30px] justify-center max-w-[calc(100vw-32px)] sm:max-w-[340px] md:max-w-none transition-opacity duration-300 ${status === "loading" ? "opacity-0" : "opacity-100"}`}
      >
        <div className="w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
        <span className="font-body font-medium text-[11px] sm:text-[12px] md:text-[14px] leading-[14px] md:leading-[18.67px] text-text-dark whitespace-nowrap overflow-hidden text-ellipsis">
          {status === "authed" 
            ? "You have unlimited conversions access." 
            : "3 free conversions. Create a free account for unlimited access."}
        </span>
      </div>

      {/* Main Heading */}
      <h1 className="font-heading font-semibold text-[32px] leading-[34px] md:text-[56px] md:leading-[61px] tracking-[0.04em] text-center text-text-dark">
        From <span className="text-brand-primary">SVG to PNG,</span> Exactly<br className="hidden md:inline" /> as Intended
      </h1>

      {/* Description */}
      <p className="font-body font-normal text-[14px] md:text-[16px] leading-[18.67px] tracking-[0%] text-center text-text-muted max-w-[361px] md:max-w-[500px]">
        Paste your SVG code, upload a file, or drag and drop it. Generate crisp PNGs in seconds for Outlook, Gmail, newsletters, websites, and more.
      </p>
      
    </section>
  );
}
