"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { UseCase } from "@/lib/data/use-cases";
import { ALL_CATEGORIES, filterUseCases, categoryKey } from "@/lib/data/use-case-filter";
import { UseCaseCard } from "@/components/use-case/UseCaseCard";

interface UseCaseListingProps {
  useCases: UseCase[];
  categories: string[];
}

export function UseCaseListing({ useCases, categories }: UseCaseListingProps) {
  const t = useTranslations("use_case");
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);

  const labelFor = (cat: string) => {
    if (cat === ALL_CATEGORIES) return t("all");
    const key = categoryKey(cat);
    return key ? t(`categories.${key}`) : cat;
  };

  const filtered = useMemo(
    () => filterUseCases(useCases, selectedCategory, ""),
    [useCases, selectedCategory]
  );

  return (
    <div className="w-full max-w-[1140px] px-[16px] md:px-[32px] pt-[32px] pb-[32px] md:pt-[56px] md:pb-[40px] flex flex-col gap-[40px] md:gap-[60px]">
      {/* Category Filters */}
      <div className="w-full flex items-center justify-center">
        <div className="flex flex-wrap items-center justify-center gap-[8px] w-full">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-[16px] py-[8px] rounded-[30px] text-[13px] md:text-[14px] font-heading font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white"
                    : "bg-white border border-[#EAEAEA] text-[#4B5563] hover:border-brand-primary hover:text-brand-primary"
                }`}
              >
                {labelFor(cat)}
              </button>
            );
          })}
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
              {t("noResultsTitle")}
            </p>
            <p className="font-body text-[14px] text-text-muted mb-[20px]">
              {t("noResultsBody")}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(ALL_CATEGORIES);
              }}
              className="px-[20px] py-[10px] rounded-[8px] bg-[#D94A1E] text-white font-heading font-medium text-[14px] hover:bg-[#c4411a] transition-colors"
            >
              {t("resetFilters")}
            </button>
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="w-full bg-[#FAF6F3] border border-[#EAEAEA] rounded-[16px] md:rounded-[24px] p-[24px] md:p-[44px] flex flex-col md:flex-row items-center justify-between gap-[24px]">
        <div className="flex flex-col items-center md:items-start gap-[8px] text-center md:text-left max-w-[640px]">
          <h3 className="font-heading font-semibold text-[20px] md:text-[26px] leading-[26px] md:leading-[32px] tracking-[0.04em] text-text-dark">
            {t("ctaHeadingPre")}
            <span className="text-[#DA582D]">SVG</span>
            {t("ctaHeadingPost")}
          </h3>
          <p className="font-body font-normal text-[14px] md:text-[16px] leading-[22px] text-text-muted">
            {t("ctaBody")}
          </p>
        </div>
        <div className="flex items-center gap-[12px] shrink-0">
          <Link
            href="/#converter"
            className="inline-flex items-center justify-center h-[42px] md:h-[46px] px-[20px] md:px-[26px] rounded-[8px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] font-heading font-medium text-[14px] md:text-[16px] text-white tracking-[0.04em] hover:opacity-90 transition-opacity"
          >
            {t("launchConverter")}
          </Link>
        </div>
      </section>
    </div>
  );
}
