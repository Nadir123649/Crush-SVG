import React from "react";
import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "Terms & Conditions | CrushSVG",
  description: "Terms and conditions for using CrushSVG, an SVG to PNG conversion tool.",
  canonicalPath: "/terms",
});

export default function TermsAndConditions() {
  return (
    <div className="w-full flex justify-center py-[40px] md:py-[80px]">
      <article className="w-full max-w-[800px] flex flex-col gap-[24px]">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center max-w-[800px] mb-[16px] md:mb-[60px] mx-auto">
          <h1 className="font-heading font-semibold text-[30px] leading-[36px] md:text-[56px] md:leading-[61px] tracking-[0.04em] text-text-dark mb-[8px] md:mb-[16px]">
            Terms of <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">Service</span>
          </h1>
        </div>

        {/* Content */}
        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">1. Introduction & Acceptance</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            Welcome to CrushSVG. By accessing or using our website and services, you agree to comply with and be bound by these Terms & Conditions. If you do not agree to these terms, please do not use our service. CrushSVG provides an online utility to convert SVG images into PNG formats.
          </p>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">2. Eligibility & User Accounts</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            You must be at least 13 years old to use our service. Certain features of CrushSVG require you to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">3. Use of the Service</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            CrushSVG grants you a limited, non-exclusive, non-transferable, and revocable license to use our service for converting SVGs into PNGs. You agree to use the service only for lawful purposes and in accordance with these Terms.
          </p>
          <ul className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%] list-disc pl-[24px] flex flex-col gap-[8px]">
            <li>You may not use the service to process files containing malware, viruses, or other malicious code.</li>
            <li>You may not attempt to reverse-engineer, interfere with, or disrupt the operation of CrushSVG or its servers.</li>
            <li>You may not abuse the service by initiating automated mass-conversions without prior authorization.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">4. User Content & Intellectual Property</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            You retain all ownership and intellectual property rights in the SVG files you upload and the resulting PNG files you download. CrushSVG does not claim any ownership over your content. By uploading files, you grant us a temporary license solely to process and convert your files as requested. We do not permanently store your converted images, nor do we use them for any purpose other than providing the service to you.
          </p>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">5. Third-Party Services</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            Our service relies on third-party infrastructure (such as cloud hosting, databases, and email providers) to function. Your use of CrushSVG is subject to the continuous availability of these third-party services. We do not assume responsibility for outages or failures originating from third-party providers.
          </p>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">6. Disclaimers & Limitation of Liability</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            The service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis, without warranties of any kind, either express or implied. CrushSVG does not guarantee that conversions will always be flawless, uninterrupted, or perfectly accurate to your original SVG depending on file complexity.
          </p>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            In no event shall CrushSVG or its creators be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, arising out of your use of or inability to use the service.
          </p>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">7. Termination</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            We reserve the right to suspend or terminate your account or access to the service at our sole discretion, without notice or liability, for any reason, including if you breach these Terms.
          </p>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">8. Contact Information</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            If you have any questions or concerns about these Terms & Conditions, please contact us at support@crushsvg.net.
          </p>
        </section>

      </article>
    </div>
  );
}
