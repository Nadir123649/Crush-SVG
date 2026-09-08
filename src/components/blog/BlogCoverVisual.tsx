"use client";

import React from "react";
import Image from "next/image";

interface BlogCoverVisualProps {
  coverImage?: string;
  title: string;
  category: string;
  readTime?: string;
  isLarge?: boolean;
  className?: string;
}

export function BlogCoverVisual({
  coverImage,
  title,
  category,
  readTime,
  isLarge = false,
  className = "",
}: BlogCoverVisualProps) {
  // If user provides an actual custom image that is not the generic placeholder
  const hasCustomImage =
    coverImage &&
    coverImage !== "/blog.png" &&
    coverImage.trim() !== "";

  if (hasCustomImage) {
    return (
      <div
        className={`w-full aspect-[1200/644] rounded-[12px] md:rounded-[18px] bg-[#FAF6F3] overflow-hidden relative border border-[#EAEAEA] ${className}`}
      >
        <Image
          src={coverImage}
          alt={title}
          fill
          priority={isLarge}
          sizes={isLarge ? "(max-width: 1024px) 100vw, 840px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-[12px] left-[12px] bg-white/95 backdrop-blur-sm px-[10px] py-[3px] rounded-full shadow-sm border border-[#EAEAEA] z-10">
          <span className="font-body text-[11px] md:text-[12px] font-semibold text-brand-primary">
            {category}
          </span>
        </div>
      </div>
    );
  }

  // Pure brand vector cover visual — 100% responsive, sleek and matches CrushSVG branding
  return (
    <div
      className={`w-full aspect-[1200/644] rounded-[12px] md:rounded-[20px] bg-gradient-to-br from-[#FCF1ED] via-[#FFF6F0] to-[#FAF3EE] p-[20px] md:p-[36px] flex flex-col justify-between overflow-hidden relative border border-[#F2EDE8] shadow-[0px_2px_16px_rgba(217,74,30,0.05)] select-none ${className}`}
    >
      {/* Decorative Vector Grid / Shapes */}
      <div className="absolute -right-8 -bottom-10 w-48 h-48 md:w-72 md:h-72 rounded-full bg-gradient-to-tr from-[#D94A1E]/10 to-[#FF9A3D]/20 blur-2xl pointer-events-none" />
      <div className="absolute -left-6 -top-6 w-36 h-36 rounded-full bg-[#D94A1E]/5 blur-xl pointer-events-none" />

      {/* Top Row: Logo Badge + Category Tag */}
      <div className="flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="w-5 h-5 rounded-[5px] bg-[#D94A1E] flex items-center justify-center text-white text-[10px] font-heading font-black tracking-tight">
            SVG
          </div>
          <span className="font-heading font-bold text-[13px] text-text-dark tracking-tight">
            Crush<span className="text-brand-primary">SVG</span>
          </span>
        </div>

        <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full border border-[#EAEAEA] shadow-sm">
          <span className="font-body text-[11px] md:text-[12px] font-semibold text-brand-primary">
            {category}
          </span>
        </div>
      </div>

      {/* Center Motif: Vector to PNG Graphic */}
      <div className="my-auto py-2 z-10 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 md:gap-3 bg-white/85 backdrop-blur-md px-3 md:px-5 py-2 md:py-2.5 rounded-2xl border border-[#EAEAEA] shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-transform duration-300 group-hover:scale-105">
          <div className="flex items-center gap-1.5 font-heading font-semibold text-xs md:text-sm text-text-dark">
            <span className="px-2 py-0.5 rounded bg-[#FAF4EF] text-brand-primary border border-brand-primary/20">
              .SVG
            </span>
            <span className="text-brand-primary font-bold">&rarr;</span>
            <span className="px-2 py-0.5 rounded bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white">
              .PNG
            </span>
          </div>
          <span className="hidden sm:inline w-1 h-1 rounded-full bg-[#D1D5DB]" />
          <span className="hidden sm:inline font-body text-xs font-semibold text-[#57534E]">
            2x Retina Output
          </span>
        </div>

        {isLarge && (
          <p className="mt-3 font-heading font-medium text-xs md:text-sm text-text-muted max-w-[420px] line-clamp-1">
            Compatible with Outlook, Gmail, Apple Mail &amp; High-DPI screens
          </p>
        )}
      </div>

      {/* Bottom Row: Support Badges */}
      <div className="flex items-center justify-between text-[10px] md:text-[11px] text-text-muted font-body z-10 pt-1 border-t border-[#F2EDE8]/80">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="inline-flex items-center gap-1 font-medium text-text-dark">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            Outlook Tested
          </span>
          <span className="text-text-muted/50">&bull;</span>
          <span className="inline-flex items-center gap-1 font-medium text-text-dark">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            Transparent PNG
          </span>
        </div>

        {readTime && (
          <span className="font-medium text-text-muted bg-white/80 px-2 py-0.5 rounded-md border border-[#EAEAEA]/80">
            {readTime}
          </span>
        )}
      </div>
    </div>
  );
}
