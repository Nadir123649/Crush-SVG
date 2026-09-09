"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { IMAGES } from "@/lib/shared/images";
import { useAuth } from "@/lib/client/auth-context";
import { getFAQSchema } from "@/lib/seo";
import { useTranslations } from "next-intl";

export function FAQ({ mode = "svg-to-png" }: { mode?: "svg-to-png" | "raster-to-svg" | "background-remover" | "image-resizer" }) {
  const tFaq = useTranslations("FAQ");
  const tFooter = useTranslations("faq_footer");
  const { status } = useAuth();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  let faqs: { question: string; answer: string }[] = [];

  if (mode === "svg-to-png") {
    try {
      const rawFaqs = tFaq.raw("svg") as { question: string; answer: string }[];
      if (Array.isArray(rawFaqs)) {
        faqs = rawFaqs;
      }
    } catch {
      // fallback
    }
  }

  if (mode === "background-remover") {
    try {
      const rawFaqs = tFaq.raw("bg") as { question: string; answer: string }[];
      if (Array.isArray(rawFaqs)) {
        faqs = rawFaqs;
      }
    } catch {
      // fallback
    }
  } else if (mode === "image-resizer") {
    try {
      const rawFaqs = tFaq.raw("resizer") as { question: string; answer: string }[];
      if (Array.isArray(rawFaqs)) {
        faqs = rawFaqs;
      }
    } catch {
      // fallback
    }
  } else if (mode === "raster-to-svg") {
    try {
      const rawFaqs = tFaq.raw("raster") as { question: string; answer: string }[];
      if (Array.isArray(rawFaqs)) {
        faqs = rawFaqs;
      }
    } catch {
      // fallback
    }
  } else if (faqs.length === 0) {
    try {
      const rawFaqs = tFaq.raw("svg") as { question: string; answer: string }[];
      if (Array.isArray(rawFaqs)) {
        faqs = rawFaqs;
      }
    } catch {
      // fallback
    }
  }

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="w-full flex flex-col items-center mb-[60px] md:mb-[50px] scroll-mt-[100px] md:scroll-mt-[140px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getFAQSchema(faqs)) }}
      />
      <h2 className="font-heading font-semibold text-[24px] leading-[30px] md:text-[48px] md:leading-[61px] tracking-[0.04em] text-center text-text-dark mb-[30px] md:mb-[60px]">
        {tFaq("title")}
      </h2>

      <div className="flex flex-col w-full max-w-[361px] md:max-w-[890px] gap-[12px] md:gap-[24px]">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index}
              onClick={() => toggleFaq(index)}
              className="w-full bg-white rounded-[12px] p-[12px] md:p-[24px] cursor-pointer transition-all duration-300 flex flex-col justify-center"
              style={{
                boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)"
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
                  className={`w-[12px] h-[9px] md:w-[16px] md:h-[12px] object-contain transform transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                />
              </div>
              <div 
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100 mt-[10px]" : "grid-rows-[0fr] opacity-0 mt-0"
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

      {/* Helpful FAQ Footer Links */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-center">
        <span className="font-afacad text-sm md:text-base text-text-muted">{tFooter("specificQuestion")}</span>
        <div className="flex items-center gap-3">
          <Link href="/help" className="font-afacad text-sm md:text-base font-semibold text-brand-primary hover:underline">
            {tFooter("viewAllFaqs")} &rarr;
          </Link>
          <span className="text-text-muted/40">&bull;</span>
          <Link href="/svg-guides" className="font-afacad text-sm md:text-base font-semibold text-brand-primary hover:underline">
            {tFooter("svgGuides")}
          </Link>
          <span className="text-text-muted/40">&bull;</span>
          <Link href="/contact-us" className="font-afacad text-sm md:text-base font-semibold text-brand-primary hover:underline">
            {tFooter("contactUs")}
          </Link>
        </div>
      </div>
    </section>
  );
}
