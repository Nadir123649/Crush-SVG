import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FAQ } from "@/components/sections/FAQ";
import { constructMetadata } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "Help & FAQ | CrushSVG",
  description: "Get answers to frequently asked questions about converting SVG to PNG, transparency, resolution, and troubleshooting.",
  canonicalPath: "/help",
  keywords: ["crush svg help", "svg to png faq", "svg conversion troubleshooting", "crushsvg support"],
});

export default function HelpPage() {
  return (
    <div className="w-full flex flex-col items-center md:py-[60px] min-h-[60vh]">

      {/* Header Section */}
      <div className="flex flex-col items-center text-center max-w-[800px] mb-[24px] md:mb-[40px]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCF1ED] text-brand-primary text-sm font-semibold mb-4 border border-[#F2EDE8]">
          <span>Knowledge & Support</span>
        </div>
        <h1 className="font-heading font-semibold text-[32px] leading-[40px] md:text-[56px] md:leading-[61px] tracking-[0.04em] text-text-dark mb-[16px]">
          Help & <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">FAQ</span>
        </h1>
        <p className="font-afacad text-[16px] md:text-[20px] text-text-muted leading-[1.5] max-w-[620px]">
          Need assistance with CrushSVG? Check our frequently asked questions, read our <Link href="/svg-guides" className="text-brand-primary hover:underline font-medium">technical guides</Link>, or contact <Link href="/team" className="text-brand-primary hover:underline font-medium">our team</Link> directly.
        </p>
      </div>

      {/* Quick Resource Cards */}
      <div className="w-full max-w-[890px] grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Link
          href="/svg-guides"
          className="p-5 bg-white rounded-2xl border border-[#F2EDE8] hover:border-brand-primary transition-all flex flex-col justify-between group"
          style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}
        >
          <div>
            <h2 className="font-heading font-semibold text-base text-text-dark group-hover:text-brand-primary mb-1">
              SVG Guides
            </h2>
            <p className="font-afacad text-sm text-text-muted">Best practices for Figma, Gmail, and vector optimization.</p>
          </div>
          <span className="text-xs font-semibold text-brand-primary mt-3 inline-block">Read Guides &rarr;</span>
        </Link>

        <Link
          href="/support"
          className="p-5 bg-white rounded-2xl border border-[#F2EDE8] hover:border-brand-primary transition-all flex flex-col justify-between group"
          style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}
        >
          <div>
            <h2 className="font-heading font-semibold text-base text-text-dark group-hover:text-brand-primary mb-1">
              Support Center
            </h2>
            <p className="font-afacad text-sm text-text-muted">Technical troubleshooting and conversion error solutions.</p>
          </div>
          <span className="text-xs font-semibold text-brand-primary mt-3 inline-block">View Support &rarr;</span>
        </Link>

        <Link
          href="/"
          className="p-5 bg-white rounded-2xl border border-[#F2EDE8] hover:border-brand-primary transition-all flex flex-col justify-between group"
          style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}
        >
          <div>
            <h2 className="font-heading font-semibold text-base text-text-dark group-hover:text-brand-primary mb-1">
              SVG Converter
            </h2>
            <p className="font-afacad text-sm text-text-muted">Jump straight into converting files with custom dimensions.</p>
          </div>
          <span className="text-xs font-semibold text-brand-primary mt-3 inline-block">Open Tool &rarr;</span>
        </Link>
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
        <p className="font-afacad text-[16px] md:text-[18px] text-text-muted text-center mb-[24px] max-w-[500px]">
          If you couldn&apos;t find what you were looking for, our team at The Nevon is ready to assist you with any custom vector requirements.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            href="/contact-us"
            className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bricolage font-semibold text-[16px] py-[12px] px-[32px] rounded-[12px] hover:opacity-90 transition-opacity"
          >
            Contact Support Team
          </Link>
          <a
            href="mailto:support@crushsvg.net"
            className="font-afacad font-medium text-text-muted hover:text-brand-primary hover:underline text-sm"
          >
            or email support@crushsvg.net
          </a>
        </div>
      </div>
    </div>
  );
}
