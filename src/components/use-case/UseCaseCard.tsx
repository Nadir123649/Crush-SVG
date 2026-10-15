"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { UseCase } from "@/lib/data/use-cases";
import { categoryKey } from "@/lib/data/use-case-filter";

type UseCaseCardData = Pick<UseCase, "slug" | "title" | "description" | "features" | "category">;

const ICON_PATHS: Record<string, string> = {
  // palette
  "Design Tools":
    "M12 3a9 9 0 100 18c1.1 0 1.8-.9 1.5-1.9-.3-1 .4-2.1 1.5-2.1H17a4 4 0 004-4c0-5-4-10-9-10zM7.5 12a1 1 0 110-2 1 1 0 010 2zm3-4a1 1 0 110-2 1 1 0 010 2zm4 0a1 1 0 110-2 1 1 0 010 2z",
  // code brackets
  "Web & Dev": "M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14",
  // envelope
  Email: "M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm1 0l8 6 8-6",
  // printer
  "Print & Craft": "M7 9V4h10v5M7 17H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2M7 14h10v6H7v-6z",
  // sparkles
  "Image Quality": "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zm7 11l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z",
  // arrows left-right
  Conversion: "M4 8h14m0 0l-4-4m4 4l-4 4M20 16H6m0 0l4-4m-4 4l4 4",
};
const FALLBACK_ICON = ICON_PATHS["Web & Dev"];

export function UseCaseCard({ useCase }: { useCase: UseCaseCardData }) {
  const t = useTranslations("use_case");
  const categoryMessageKey = categoryKey(useCase.category);

  return (
    <Link
      href={`/use-case/${useCase.slug}` as never}
      className="relative flex flex-col w-full bg-white rounded-[20px] md:rounded-[24px] border border-[#F2EDE8] p-[20px] md:p-[26px] gap-[18px] overflow-hidden transition-all duration-300 ease-in-out hover:bg-[#FFFBF7] hover:border-[#F1B7A1] hover:shadow-[0px_14px_40px_-6px_rgba(217,74,30,0.12)] hover:-translate-y-1.5 cursor-pointer group shadow-[0px_4px_24px_0px_rgba(0,0,0,0.03)]"
    >
      {/* Top subtle brand accent line on hover */}
      <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Card Header: Icon & Category Badge */}
      <div className="flex items-center justify-between gap-[12px]">
        <div className="w-[48px] h-[48px] rounded-[14px] bg-[#FFF1EB] border border-[#F0C9B9] flex items-center justify-center text-brand-primary group-hover:bg-gradient-to-br group-hover:from-[#D94A1E] group-hover:to-[#FF9A3D] group-hover:text-white group-hover:border-transparent group-hover:shadow-[0px_8px_20px_rgba(217,74,30,0.25)] transition-all duration-300 shrink-0">
          <svg
            className="w-[22px] h-[22px] transition-transform duration-300 group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d={ICON_PATHS[useCase.category] ?? FALLBACK_ICON} />
          </svg>
        </div>
        <span className="font-body text-[11.5px] md:text-[12px] font-semibold text-brand-primary bg-[#FFF6F2] border border-[#F5D8CC] px-[12px] py-[3.5px] rounded-full whitespace-nowrap tracking-wide">
          {categoryMessageKey ? t(`categories.${categoryMessageKey}`) : useCase.category}
        </span>
      </div>

      {/* Card Body: Title, Description, and Features */}
      <div className="flex flex-col gap-[12px] w-full min-w-0 flex-1">
        <h3 className="font-heading font-bold text-[19px] md:text-[20px] leading-[25px] md:leading-[27px] tracking-tight text-[#202427] group-hover:text-brand-primary transition-colors line-clamp-2">
          {useCase.title}
        </h3>
        <p className="font-body font-normal text-[13.5px] md:text-[14px] leading-[22px] md:leading-[23px] text-text-muted line-clamp-3">
          {useCase.description}
        </p>

        {/* Feature Highlights with Brand Checkmarks */}
        <ul className="flex flex-col gap-[9px] pt-[6px]">
          {useCase.features.slice(0, 3).map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-[10px] font-body text-[13px] leading-[20px] text-[#4B5563]"
            >
              <div className="w-[16px] h-[16px] rounded-full bg-[#FFF1EB] flex items-center justify-center shrink-0 mt-[2px] text-brand-primary">
                <svg
                  className="w-[10px] h-[10px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="line-clamp-2">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Footer Link with Interactive Circular Arrow */}
        <div className="mt-auto pt-[14px] border-t border-[#F2EDE8] flex items-center justify-between text-[13.5px] md:text-[14px] font-heading font-semibold text-brand-primary">
          <span>{t("viewUseCase")}</span>
          <span className="w-[26px] h-[26px] rounded-full bg-[#FFF1EB] text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 flex items-center justify-center text-xs group-hover:translate-x-0.5">
            &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
