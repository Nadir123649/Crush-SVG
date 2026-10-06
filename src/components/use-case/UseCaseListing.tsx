"use client";

import React, { useState, useMemo } from "react";
import { Link } from "@/i18n/routing";
import type { UseCase } from "@/lib/data/use-cases";
import { ALL_CATEGORIES, filterUseCases } from "@/lib/data/use-case-filter";
import { UseCaseCard } from "@/components/use-case/UseCaseCard";

interface UseCaseListingProps {
  useCases: UseCase[];
  categories: string[];
}

export function UseCaseListing({ useCases, categories }: UseCaseListingProps) {
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(
    () => filterUseCases(useCases, selectedCategory, searchQuery),
    [useCases, selectedCategory, searchQuery]
  );

  return (
    <div className="w-full max-w-[1140px] px-[16px] md:px-[32px] py-[32px] md:py-[56px] flex flex-col gap-[40px] md:gap-[60px]">
      {/* Search & Category Filter Controls */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-[16px] bg-white rounded-[16px] md:rounded-[20px] p-[16px] md:p-[20px] border border-[#EAEAEA] shadow-[0px_4px_30px_rgba(0,0,0,0.03)]">
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
            placeholder="Search use cases..."
            aria-label="Search use cases"
            className="w-full pl-[38px] pr-[32px] py-[9px] bg-[#FAF6F3] rounded-[10px] text-[14px] text-text-dark placeholder:text-text-muted border border-[#EAEAEA] focus:border-brand-primary focus:bg-white focus:outline-none transition-all font-body"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[12px] text-text-muted hover:text-text-dark font-body"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <section className="w-full">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px] md:gap-[28px]">
            {filtered.map((uc) => (
              <UseCaseCard
                key={uc.slug}
                useCase={{
                  slug: uc.slug,
                  title: uc.title,
                  description: uc.description,
                  features: uc.features,
                  category: uc.category,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="w-full text-center py-[60px] bg-white rounded-[16px] md:rounded-[24px] border border-[#EAEAEA]">
            <p className="font-heading font-semibold text-[20px] text-text-dark mb-[8px]">
              No matching use cases found
            </p>
            <p className="font-body text-[14px] text-text-muted mb-[20px]">
              Try adjusting your search query or select another category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(ALL_CATEGORIES);
                setSearchQuery("");
              }}
              className="px-[20px] py-[10px] rounded-[8px] bg-[#D94A1E] text-white font-heading font-medium text-[14px] hover:bg-[#c4411a] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="w-full bg-[#FAF6F3] border border-[#EAEAEA] rounded-[16px] md:rounded-[24px] p-[24px] md:p-[44px] flex flex-col md:flex-row items-center justify-between gap-[24px]">
        <div className="flex flex-col items-center md:items-start gap-[8px] text-center md:text-left max-w-[640px]">
          <h3 className="font-heading font-semibold text-[20px] md:text-[26px] leading-[26px] md:leading-[32px] tracking-[0.04em] text-text-dark">
            Ready to convert your <span className="text-[#DA582D]">SVG</span>?
          </h3>
          <p className="font-body font-normal text-[14px] md:text-[16px] leading-[22px] text-text-muted">
            Upload your vector file and get crisp, high-resolution PNGs in seconds. Free, browser-based, no install needed.
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
