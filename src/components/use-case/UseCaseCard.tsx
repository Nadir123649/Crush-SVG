"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import type { UseCase } from "@/lib/data/use-cases";

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
  return (
    <Link
      href={`/use-case/${useCase.slug}` as never}
      className="relative flex flex-col w-full bg-white rounded-[16px] md:rounded-[24px] border border-[#EAEAEA] p-[18px] md:p-[24px] gap-[16px] overflow-hidden transition-all duration-300 hover:shadow-[0px_10px_40px_rgba(217,74,30,0.14)] hover:-translate-y-1 cursor-pointer group"
      style={{ boxShadow: "0px 4px 30px rgba(0, 0, 0, 0.03)" }}
    >
      <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center justify-between gap-[12px]">
        <div className="w-[44px] h-[44px] rounded-[12px] bg-gradient-to-br from-[#D94A1E] to-[#FF9A3D] flex items-center justify-center shadow-[0px_6px_16px_rgba(217,74,30,0.25)] transition-transform duration-300 group-hover:scale-105">
          <svg
            className="w-[22px] h-[22px] text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d={ICON_PATHS[useCase.category] ?? FALLBACK_ICON} />
          </svg>
        </div>
        <span className="font-body text-[11px] md:text-[12px] font-semibold text-brand-primary bg-[#FCF1ED] border border-[#F2EDE8] px-[10px] py-[3px] rounded-full whitespace-nowrap">
          {useCase.category}
        </span>
      </div>

      <div className="flex flex-col gap-[10px] w-full min-w-0 flex-1">
        <h3 className="font-heading font-semibold text-[18px] md:text-[20px] leading-[24px] md:leading-[27px] tracking-[0.03em] text-text-dark group-hover:text-brand-primary transition-colors line-clamp-2">
          {useCase.title}
        </h3>
        <p className="font-body font-normal text-[14px] leading-[22px] text-text-muted line-clamp-3">
          {useCase.description}
        </p>

        <ul className="flex flex-col gap-[8px] pt-[4px]">
          {useCase.features.slice(0, 3).map((feature) => (
            <li key={feature} className="flex items-start gap-[8px] font-body text-[13px] leading-[19px] text-[#4B5563]">
              <svg
                className="w-[16px] h-[16px] mt-[2px] shrink-0 text-brand-primary"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              <span className="line-clamp-2">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-[10px] flex items-center gap-1.5 text-[14px] font-heading font-medium text-brand-primary group-hover:gap-2.5 transition-all">
          <span>View Use Case</span>
          <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
        </div>
      </div>
    </Link>
  );
}
