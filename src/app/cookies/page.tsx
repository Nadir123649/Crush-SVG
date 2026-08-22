import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { constructMetadata } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "Cookies Policy | CrushSVG",
  description: "Cookies policy for CrushSVG, explaining how we use cookies and similar technologies.",
  canonicalPath: "/cookies",
  keywords: ["crush svg cookies", "crushsvg cookie policy"],
});

export default function CookiesPolicyPage() {
  return (
    <div className="w-full flex justify-center py-[40px] md:py-[80px]">
      <article className="w-full max-w-[800px] flex flex-col gap-[24px]">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center max-w-[800px] mb-[16px] md:mb-[40px] mx-auto">
          <h1 className="font-heading font-semibold text-[30px] leading-[36px] md:text-[56px] md:leading-[61px] tracking-[0.04em] text-text-dark mb-[8px] md:mb-[16px]">
            Cookies <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">Policy</span>
          </h1>
          <p className="font-afacad text-sm md:text-base text-text-muted">
            Last updated: August 2026 &bull; Part of CrushSVG by <Link href="/about" className="text-brand-primary hover:underline font-medium">The Nevon</Link>
          </p>
        </div>

        {/* Content */}
        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">1. How We Use Cookies</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            At CrushSVG, we use cookies to enhance your browsing experience and ensure the proper functioning of our <Link href="/" className="text-brand-primary hover:underline font-medium">SVG conversion tool</Link>. Specifically, we use cookies for:
          </p>
          <ul className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%] list-disc pl-[24px] flex flex-col gap-[8px]">
            <li><strong>Authentication & Security:</strong> To keep you securely logged into your account and protect against fraudulent activity.</li>
            <li><strong>Session Management:</strong> To remember your conversion preferences (like selected width or format) across different sessions.</li>
            <li><strong>Analytics:</strong> To understand how users interact with our website, helping us improve the user experience and service performance.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">2. Types of Cookies We Use</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            <strong>Essential Cookies:</strong> These cookies are strictly necessary to provide you with services available through our website and to use some of its features. Without these, core functionalities like user logins cannot be provided.
          </p>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            <strong>Performance & Analytics Cookies:</strong> These cookies collect information that is used either in aggregate form to help us understand how our website is being used, or to help us customize our website and application for you in order to enhance your experience.
          </p>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">3. Third-Party Cookies</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            In some special cases, we also use cookies provided by trusted third parties. For example, we use analytics services (such as Google Analytics) which use cookies to track things such as how long you spend on the site and the pages that you visit so we can continue to produce engaging content.
          </p>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">4. Your Choices Regarding Cookies</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            You have the right to decide whether to accept or reject cookies. You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website, though your access to some functionality and areas of our website may be restricted (for example, logging into your account).
          </p>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">5. Related Policies & Updates</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            For more details on how we handle personal data, please review our <Link href="/privacy-policy" className="text-brand-primary hover:underline font-medium">Privacy Policy</Link> and <Link href="/terms" className="text-brand-primary hover:underline font-medium">Terms of Service</Link>.
          </p>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">6. Contact Us</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            If you have any questions about our use of cookies or other technologies, please reach out via our <Link href="/contact-us" className="text-brand-primary hover:underline font-medium">Contact Page</Link> or email us at <a href="mailto:privacy@crushsvg.net" className="text-brand-primary hover:underline">privacy@crushsvg.net</a>.
          </p>
        </section>

      </article>
    </div>
  );
}
