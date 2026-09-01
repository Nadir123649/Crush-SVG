"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/client/auth-context";

interface HeroProps {
  badge?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  showAuthBadge?: boolean;
  className?: string;
}

export function Hero({ badge, title, subtitle, showAuthBadge, className = "" }: HeroProps) {
  const { status } = useAuth();
  // Auth status is only known on the client. Render a stable value during
  // SSR and the first client render so hydration matches; update after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const viewStatus = mounted ? status : "loading";
  const shouldShowAuthBadge = showAuthBadge !== false && !badge;

  return (
    <section id="hero" className={`flex flex-col items-center w-full max-w-[361px] md:max-w-[795px] mx-auto mt-[30px] md:mt-[54px] gap-[16px] md:gap-[14px] ${className}`}>
      
      {/* Badge */}
      {shouldShowAuthBadge ? (
        <div 
          suppressHydrationWarning
          style={{ 
            border: "1px solid transparent",
            background: "linear-gradient(#FFFCFA, #FFFCFA) padding-box, linear-gradient(to right, #D94A1E, #FF9A3D) border-box"
          }}
          className={`flex items-center gap-[6px] md:gap-[10px] h-[24px] md:h-[29px] rounded-[30px] px-[12px] md:px-[30px] justify-center max-w-[calc(100vw-32px)] sm:max-w-[340px] md:max-w-none`}
        >
          <div className="relative flex w-[6px] h-[6px] shrink-0">
            <span className="animate-soft-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-80"></span>
            <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-brand-primary"></span>
          </div>
          <span className="font-body font-medium text-[12px] sm:text-[12px] md:text-[14px] leading-[14px] md:leading-[18.67px] text-text-dark whitespace-nowrap overflow-hidden text-ellipsis">
            <span className="logged-in-only">You have unlimited conversions access.</span>
            <span className="logged-out-only">3 free conversions. Create a free account for unlimited access.</span>
          </span>
        </div>
      ) : badge ? (
        typeof badge === "string" ? (
          <div 
            style={{ 
              border: "1px solid transparent",
              background: "linear-gradient(#FFFCFA, #FFFCFA) padding-box, linear-gradient(to right, #D94A1E, #FF9A3D) border-box"
            }}
            className="flex items-center gap-[6px] md:gap-[10px] h-[24px] md:h-[29px] rounded-[30px] px-[12px] md:px-[30px] justify-center max-w-[calc(100vw-32px)] sm:max-w-[340px] md:max-w-none transition-opacity duration-300"
          >
            <div className="relative flex w-[6px] h-[6px] shrink-0">
              <span className="animate-soft-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-80"></span>
              <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-brand-primary"></span>
            </div>
            <span className="font-body font-medium text-[12px] sm:text-[12px] md:text-[14px] leading-[14px] md:leading-[18.67px] text-text-dark whitespace-nowrap overflow-hidden text-ellipsis">
              {badge}
            </span>
          </div>
        ) : (
          badge
        )
      ) : null}

      {/* Main Heading */}
      <h1 className="font-heading font-semibold text-[32px] leading-[34px] md:text-[56px] md:leading-[61px] tracking-[0.04em] text-center text-text-dark">
        {title ? title : (
          <>
            From <span className="text-brand-primary">SVG to PNG,</span> Exactly<br className="hidden md:inline" /> as Intended
          </>
        )}
      </h1>

      {/* Description */}
      <p className="font-body font-normal text-[14px] md:text-[16px] leading-[18.67px] tracking-[0%] text-center text-text-muted max-w-[361px] md:max-w-[600px]">
        {subtitle ? subtitle : "Paste your SVG code, upload a file, or drag and drop it. Generate crisp PNGs in seconds for Outlook, Gmail, newsletters, websites, and more."}
      </p>
      
    </section>
  );
}
