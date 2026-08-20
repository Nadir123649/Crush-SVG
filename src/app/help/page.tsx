import React from "react";
import { FAQ } from "@/components/sections/FAQ";


export default function HelpPage() {
  return (
    <div className="w-full flex flex-col items-center md:py-[60px] min-h-[60vh]">

      
      {/* Header Section */}
      <div className="flex flex-col items-center text-center max-w-[800px] mb-[40px] md:mb-[60px]">
        <h1 className="font-heading font-semibold text-[32px] leading-[40px] md:text-[56px] md:leading-[61px] tracking-[0.04em] text-text-dark mb-[16px]">
          Help & <span className="text-brand-primary">Support</span>
        </h1>
        <p className="font-afacad text-[16px] md:text-[20px] text-text-muted leading-[1.5]">
          Need assistance with CrushSVG? We&apos;re here to help. Check our frequently asked questions below or reach out to our support team directly.
        </p>
      </div>

      {/* FAQ Section */}
      <div className="w-full">
        <FAQ />
      </div>

      {/* Contact Section */}
      <div className="w-full max-w-[890px] mt-[20px] mb-[40px] flex flex-col items-center bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]"
        style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}
      >
        <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[12px]">
          Still have questions?
        </h2>
        <p className="font-afacad text-[16px] md:text-[18px] text-text-muted text-center mb-[24px]">
          If you couldn&apos;t find what you were looking for, our team is always ready to assist you with any issues or feedback.
        </p>
        <a 
          href="mailto:support@crushsvg.com"
          className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-afacad font-semibold text-[18px] py-[12px] px-[32px] rounded-[12px] hover:opacity-90 transition-opacity"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
