"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import type { BlogPost } from "@/lib/blog";
import { BlogCoverVisual } from "@/components/blog/BlogCoverVisual";

export function BlogCard({ blog }: { blog: BlogPost }) {
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="flex flex-col w-full bg-white rounded-[16px] md:rounded-[24px] border border-[#EAEAEA] p-[16px] md:p-[20px] gap-[16px] transition-all duration-300 hover:shadow-[0px_10px_40px_rgba(217,74,30,0.14)] hover:-translate-y-1 cursor-pointer group"
      style={{
        boxShadow: "0px 4px 30px rgba(0, 0, 0, 0.03)",
      }}
    >
      {/* Visual Cover / Image Box */}
      <BlogCoverVisual
        coverImage={blog.cover_image}
        title={blog.title}
        category={blog.category}
        readTime={blog.readTime}
      />

      {/* Text Details */}
      <div className="flex flex-col gap-[10px] w-full min-w-0 flex-1">
        {/* Date & Category */}
        <div className="flex items-center gap-[8px] font-body text-[12px] md:text-[13px] text-text-muted">
          <time dateTime={blog.date}>{blog.formattedDate || blog.date}</time>
          <span className="w-[3px] h-[3px] rounded-full bg-[#D1D5DB]" />
          <span>{blog.readTime}</span>
        </div>

        {/* Title */}
        <h3 className="font-heading font-semibold text-[18px] md:text-[20px] leading-[24px] md:leading-[27px] tracking-[0.03em] text-text-dark group-hover:text-brand-primary transition-colors line-clamp-2">
          {blog.title}
        </h3>

        {/* Excerpt */}
        <p className="font-body font-normal text-[14px] leading-[22px] text-text-muted line-clamp-3">
          {blog.excerpt}
        </p>

        {/* Read Article CTA */}
        <div className="mt-auto pt-[6px] flex items-center gap-1.5 text-[14px] font-heading font-medium text-brand-primary group-hover:gap-2.5 transition-all">
          <span>Read Article</span>
          <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
        </div>
      </div>
    </Link>
  );
}
