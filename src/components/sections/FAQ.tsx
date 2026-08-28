"use client";

import React, { useState } from "react";
import Image from "next/image";
import { IMAGES } from "@/lib/shared/images";
import { useAuth } from "@/lib/client/auth-context";
import { getFAQSchema } from "@/lib/seo";

export function FAQ({ mode = "svg-to-png" }: { mode?: "svg-to-png" | "raster-to-svg" }) {
  const { status } = useAuth();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  let faqs = [];

  if (mode === "raster-to-svg") {
    faqs = [
      {
        question: "Can I control the quality of the vectorized SVG?",
        answer: "Yes! You can adjust presets (Low, Medium, High), color quantization, background handling, and path smoothing.",
      },
      {
        question: "Are my uploaded PNG and JPG images secure?",
        answer: "Absolutely. Your images are processed securely and we never store, share, or use your uploaded files for anything else.",
      },
      {
        question: "Does this tool support removing backgrounds?",
        answer: "Yes, you can enable the 'Ignore Background' feature to automatically remove solid backgrounds during vectorization.",
      },
      {
        question: "Do I need to install any software?",
        answer: "No, CrushSVG is entirely web-based. You can vectorize images directly in your browser without any plugins.",
      },
      {
        question: "Is CrushSVG free to use?",
        answer: "Yes! You can vectorize images for free. Creating an account unlocks unlimited conversions without any hidden fees.",
      },
      {
        question: "What image formats can I vectorize?",
        answer: "You can upload PNG, JPG, JPEG, and WebP images to convert them into crisp, scalable SVG vectors.",
      }
    ];
  } else {
    faqs = [
      {
        question: "What is the maximum resolution for PNG exports?",
        answer: "You can export PNGs at up to 4000x4000 pixels while maintaining perfect, crisp quality.",
      },
      {
        question: "Are my SVG files stored on your servers?",
        answer: "No, your privacy is our priority. Your SVG code is processed securely and is never stored or shared anywhere.",
      },
      {
        question: "Can I export PNGs with transparent backgrounds?",
        answer: "Yes, CrushSVG perfectly supports transparent backgrounds for logos, icons, and transparent vectors.",
      },
      {
        question: "Do I need to install any software?",
        answer: "No, CrushSVG is entirely web-based. You can convert files directly in your browser without any plugins.",
      },
      {
        question: "Is CrushSVG free to use?",
        answer: "Yes! You can convert files for free. Creating an account unlocks unlimited conversions without any hidden fees.",
      },
      {
        question: "Does the conversion maintain the original aspect ratio?",
        answer: "Yes, our converter automatically locks and maintains the perfect aspect ratio of your original SVG file to prevent distortion.",
      }
    ];
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
        Frequently Asked <span className="text-brand-primary">Questions</span>
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
        <span className="font-afacad text-sm md:text-base text-text-muted">Have a more specific question?</span>
        <div className="flex items-center gap-3">
          <a href="/help" className="font-afacad text-sm md:text-base font-semibold text-brand-primary hover:underline">
            View All FAQs &rarr;
          </a>
          <span className="text-text-muted/40">&bull;</span>
          <a href="/svg-guides" className="font-afacad text-sm md:text-base font-semibold text-brand-primary hover:underline">
            SVG Guides
          </a>
          <span className="text-text-muted/40">&bull;</span>
          <a href="/contact-us" className="font-afacad text-sm md:text-base font-semibold text-brand-primary hover:underline">
            Contact Us
          </a>
        </div>
      </div>
    </section>
  );
}
