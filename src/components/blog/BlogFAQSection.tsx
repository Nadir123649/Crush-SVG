"use client";

import React, { useState } from "react";
import Image from "next/image";
import { IMAGES } from "@/lib/shared/images";
import type { BlogFAQ } from "@/lib/blog";

export function BlogFAQSection({ faqs }: { faqs: BlogFAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="w-full my-[48px] md:my-[72px] flex flex-col items-center">
      <h2 className="font-heading font-semibold text-[24px] leading-[30px] md:text-[38px] md:leading-[48px] tracking-[0.04em] text-center text-text-dark mb-[24px] md:mb-[44px]">
        Frequently Asked <span className="text-brand-primary">Questions</span>
      </h2>

      <div className="flex flex-col w-full gap-[12px] md:gap-[24px]">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full bg-white rounded-[12px] p-[12px] md:p-[24px] cursor-pointer transition-all duration-300 flex flex-col justify-center"
              style={{
                boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div className="flex justify-between items-center gap-[10px]">
                <h3 className="font-heading font-medium text-[16px] text-text-dark">
                  {faq.question}
                </h3>
                <Image
                  src={IMAGES.dropdown}
                  alt="Toggle FAQ"
                  width={16}
                  height={12}
                  className={`w-[12px] h-[9px] md:w-[16px] md:h-[12px] object-contain transform transition-transform duration-300 shrink-0 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen
                    ? "grid-rows-[1fr] opacity-100 mt-[10px]"
                    : "grid-rows-[0fr] opacity-0 mt-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="font-body font-normal text-[14px] md:text-[16px] leading-[18px] md:leading-[24px] text-text-muted">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
