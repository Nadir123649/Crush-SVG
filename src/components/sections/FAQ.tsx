"use client";

import React, { useState } from "react";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Is CrushSVG really free?",
      answer: "Yes. You can convert up to three SVGs without creating an account. After that, a free account lets you continue converting no credit card, subscriptions, or hidden fees.",
    },
    {
      question: "What happens after my 3 free conversions?",
      answer: "You can create a free account to unlock unlimited conversions. There are no hidden fees or subscriptions required.",
    },
    {
      question: "Do I need to install anything?",
      answer: "No, CrushSVG is entirely web-based. You don't need to install any software or plugins. Simply paste your SVG code or upload your file directly in your browser.",
    },
    {
      question: "Is my SVG code stored or shared?",
      answer: "Your privacy is our priority. Your SVG code is processed securely and is never stored, shared, or used for any other purposes.",
    },
    {
      question: "Can I choose the output size?",
      answer: "Yes! You can specify the exact width in pixels or select a scale multiplier (1x to 16x) before downloading your PNG.",
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full flex flex-col items-center mb-[100px]">
      <h2 className="font-heading font-semibold text-[48px] leading-[61px] tracking-[0.04em] text-center text-text-dark mb-[60px]">
        Frequently Asked <span className="text-brand-primary">Questions</span>
      </h2>

      <div className="flex flex-col w-full max-w-[890px] gap-[36px]">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index}
              onClick={() => toggleFaq(index)}
              className="w-full bg-white rounded-[12px] p-[24px] cursor-pointer transition-all duration-300 flex flex-col justify-center"
              style={{
                boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)"
              }}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-medium text-[18px] text-text-dark">
                  {faq.question}
                </h3>
                <svg 
                  width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"
                  className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M8 12L0 0L16 0L8 12Z" fill="#D94A1E"/>
                </svg>
              </div>
              <div 
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100 mt-[10px]" : "grid-rows-[0fr] opacity-0 mt-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="font-body font-normal text-[16px] leading-[24px] text-text-muted">
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
