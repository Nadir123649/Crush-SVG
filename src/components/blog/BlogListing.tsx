"use client";

import React, { useState, useMemo } from "react";
import { Link } from "@/i18n/routing";
import type { BlogPost } from "@/lib/blog";
import { BlogCard } from "@/components/ui/BlogCard";
import { BlogCoverVisual } from "@/components/blog/BlogCoverVisual";

interface BlogListingProps {
  posts: BlogPost[];
  categories: string[];
}

export function BlogListing({ posts, categories }: BlogListingProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory =
        selectedCategory === "All" ||
        post.category.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  const featuredPost = posts[0];
  const showFeaturedSection =
    selectedCategory === "All" && !searchQuery.trim() && featuredPost;
  const gridPosts = showFeaturedSection ? filteredPosts.slice(1) : filteredPosts;

  return (
    <div className="w-full max-w-[1140px] px-[16px] md:px-[32px] py-[32px] md:py-[56px] flex flex-col gap-[40px] md:gap-[60px]">
      {/* Search & Category Filter Controls */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-[16px] bg-white rounded-[16px] md:rounded-[20px] p-[16px] md:p-[20px] border border-[#EAEAEA] shadow-[0px_4px_30px_rgba(0,0,0,0.03)]">
        {/* Category Pills */}
        <div className="flex items-center gap-[8px] overflow-x-auto w-full md:w-auto pb-[4px] md:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-[16px] py-[8px] rounded-[30px] text-[13px] md:text-[14px] font-heading font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white shadow-[0px_4px_16px_rgba(217,74,30,0.25)]"
                    : "bg-white border border-[#EAEAEA] text-[#4B5563] hover:border-brand-primary hover:text-brand-primary"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-[300px] shrink-0">
          <svg
            className="absolute left-[14px] top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles & guides..."
            className="w-full pl-[38px] pr-[32px] py-[9px] bg-[#FAF6F3] rounded-[10px] text-[14px] text-text-dark placeholder:text-text-muted border border-[#EAEAEA] focus:border-brand-primary focus:bg-white focus:outline-none transition-all font-body"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[12px] text-text-muted hover:text-text-dark font-body"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Prominent Featured Post (Top Showcase) */}
      {showFeaturedSection && (
        <section className="w-full">
          <Link
            href={`/blog/${featuredPost.slug}`}
            className="group block w-full bg-white rounded-[16px] md:rounded-[24px] border border-[#EAEAEA] p-[16px] md:p-[28px] lg:p-[36px] transition-all duration-300 hover:shadow-[0px_12px_45px_rgba(217,74,30,0.12)] hover:-translate-y-1"
            style={{
              boxShadow: "0px 4px 40px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-[20px] lg:gap-[36px] items-center">
              {/* Featured Cover Box */}
              <div className="lg:col-span-7 w-full">
                <BlogCoverVisual
                  coverImage={featuredPost.cover_image}
                  title={featuredPost.title}
                  category={featuredPost.category}
                  readTime={featuredPost.readTime}
                  isLarge={true}
                />
              </div>

              {/* Featured Details */}
              <div className="lg:col-span-5 flex flex-col gap-[14px]">
                {/* Live Badge */}
                <div
                  style={{
                    border: "1px solid transparent",
                    background:
                      "linear-gradient(#FFFCFA, #FFFCFA) padding-box, linear-gradient(to right, #D94A1E, #FF9A3D) border-box",
                  }}
                  className="inline-flex items-center gap-[6px] h-[26px] md:h-[28px] rounded-[30px] px-[12px] md:px-[14px] max-w-max"
                >
                  <div className="relative flex w-[6px] h-[6px] shrink-0">
                    <span className="animate-soft-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-80" />
                    <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-brand-primary" />
                  </div>
                  <span className="font-body font-medium text-[12px] md:text-[13px] text-text-dark whitespace-nowrap">
                    Featured Article
                  </span>
                </div>

                <div className="flex items-center gap-[8px] text-[13px] text-text-muted font-body">
                  <time dateTime={featuredPost.date}>
                    {featuredPost.formattedDate || featuredPost.date}
                  </time>
                  <span>•</span>
                  <span>{featuredPost.readTime}</span>
                </div>

                <h2 className="font-heading font-semibold text-[22px] md:text-[28px] lg:text-[30px] leading-[1.25] tracking-[0.03em] text-text-dark group-hover:text-brand-primary transition-colors">
                  {featuredPost.title}
                </h2>

                <p className="font-body font-normal text-[14px] md:text-[15px] leading-[24px] text-text-muted line-clamp-3">
                  {featuredPost.excerpt}
                </p>

                <div className="pt-[4px] flex items-center gap-1.5 text-brand-primary font-heading font-medium text-[15px] group-hover:gap-2.5 transition-all">
                  <span>Read Full Article</span>
                  <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Grid of Remaining Posts */}
      <section className="w-full">
        {gridPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px] md:gap-[28px]">
            {gridPosts.map((post) => (
              <BlogCard key={post.slug} blog={post} />
            ))}
          </div>
        ) : (
          <div className="w-full text-center py-[60px] bg-white rounded-[16px] md:rounded-[24px] border border-[#EAEAEA]">
            <p className="font-heading font-semibold text-[20px] text-text-dark mb-[8px]">
              No matching articles found
            </p>
            <p className="font-body text-[14px] text-text-muted mb-[20px]">
              Try adjusting your search query or select another category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="px-[20px] py-[10px] rounded-[8px] bg-[#D94A1E] text-white font-heading font-medium text-[14px] hover:bg-[#c4411a] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Bottom Conversion CTA Box (Matching Homepage Style) */}
      <section className="w-full bg-[#FAF6F3] border border-[#EAEAEA] rounded-[16px] md:rounded-[24px] p-[24px] md:p-[44px] flex flex-col md:flex-row items-center justify-between gap-[24px]">
        <div className="flex flex-col items-center md:items-start gap-[8px] text-center md:text-left max-w-[640px]">
          <span className="text-[12px] font-heading font-semibold uppercase tracking-wider text-brand-primary">
            Universal Email Fix
          </span>
          <h3 className="font-heading font-semibold text-[20px] md:text-[26px] leading-[26px] md:leading-[32px] tracking-[0.04em] text-text-dark">
            Need to convert an SVG for{" "}
            <span className="text-[#DA582D]">Outlook &amp; Gmail</span>?
          </h3>
          <p className="font-body font-normal text-[14px] md:text-[16px] leading-[22px] text-text-muted">
            Upload your vector file and get crisp, transparent 2x Retina PNGs in seconds. Free, browser-based, no install needed.
          </p>
        </div>
        <div className="flex items-center gap-[12px] shrink-0">
          <Link
            href="/#converter"
            className="inline-flex items-center justify-center h-[42px] md:h-[46px] px-[20px] md:px-[26px] rounded-[8px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] font-heading font-medium text-[14px] md:text-[16px] text-white tracking-[0.04em] hover:opacity-90 transition-opacity"
          >
            Launch Converter
          </Link>
        </div>
      </section>
    </div>
  );
}
