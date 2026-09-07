"use client";

import React from "react";
import Link from "next/link";
import type { Blog } from "@/lib/content/blogs";

export function BlogCard({ blog }: { blog: Blog }) {
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="flex flex-col w-full bg-white rounded-[12px] md:rounded-[24px] border border-[#F4F4F4] p-[10px] md:p-[20px] lg:p-[24px] gap-[16px] transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(217,74,30,0.2)] hover:-translate-y-2 cursor-pointer group"
    >
      {/* Image Box (Placeholder since we don't have actual images yet) */}
      <div className="w-full aspect-video rounded-[8px] md:rounded-[12px] bg-[#FCF1ED] flex items-center justify-center shrink-0 overflow-hidden relative">
        <div className="font-heading font-bold text-[32px] md:text-[40px] text-brand-primary opacity-20 select-none">
          CrushSVG
        </div>
        <div className="absolute top-[12px] left-[12px] bg-white/90 backdrop-blur-sm px-[10px] py-[4px] rounded-full shadow-sm border border-[#EAEAEA]">
          <span className="font-body text-[12px] font-medium text-brand-primary">{blog.category}</span>
        </div>
      </div>

      {/* Text Content */}
      <div className="flex flex-col gap-[10px] md:gap-[12px] w-full min-w-0 flex-1">
        <div className="flex items-center gap-[8px] md:gap-[12px] font-body text-[12px] text-text-muted mt-[4px]">
          <span>{blog.date}</span>
          <span className="w-[4px] h-[4px] rounded-full bg-[#D1D5DB]"></span>
          <span>{blog.readTime}</span>
        </div>
        
        <h3 className="font-heading font-semibold text-[18px] md:text-[22px] leading-[24px] md:leading-[28px] tracking-[0.04em] text-text-dark group-hover:text-brand-primary transition-colors">
          {blog.title}
        </h3>
        
        <p className="font-body font-normal text-[14px] md:text-[15px] leading-[22px] text-text-muted line-clamp-3">
          {blog.excerpt}
        </p>
        
        <span className="text-[14px] font-semibold text-brand-primary mt-auto flex items-center gap-1 group-hover:underline pt-[4px] md:pt-[8px]">
          Read Article &rarr;
        </span>
      </div>
    </Link>
  );
}
