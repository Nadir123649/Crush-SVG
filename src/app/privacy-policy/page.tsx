import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | CrushSVG",
  description: "Privacy policy for CrushSVG, detailing how we collect, use, and protect your information.",
};

export default function PrivacyPolicy() {
  return (
    <div className="w-full flex justify-center py-[40px] md:py-[80px]">
      <article className="w-full max-w-[800px] flex flex-col gap-[24px]">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-[8px] mb-[16px]">
          <h1 className="font-heading font-semibold text-[32px] md:text-[48px] text-[#D94A1E] leading-[120%] tracking-[0%]">
            Privacy Policy
          </h1>
        </div>

        {/* Content */}
        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">1. Introduction</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            At CrushSVG, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our SVG to PNG conversion service. Please read this policy carefully.
          </p>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">2. Information We Collect</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            <strong>Personal Information:</strong> If you choose to create an account, we collect personal information such as your name, email address, and authentication credentials. If you log in via a third-party provider (e.g., Google or GitHub), we receive basic profile information required to authenticate you.
          </p>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            <strong>Uploaded Content:</strong> When you use our conversion tool, you upload SVG files. We process these files strictly to generate your requested PNG output.
          </p>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            <strong>Automatically Collected Information:</strong> We automatically collect certain information about your device and usage of our website. This may include your IP address, browser type, operating system, and usage analytics.
          </p>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">3. How We Use Information</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            We use the information we collect to:
          </p>
          <ul className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%] list-disc pl-[24px] flex flex-col gap-[8px]">
            <li>Provide, operate, and maintain the CrushSVG conversion service.</li>
            <li>Manage your account and authenticate your identity securely.</li>
            <li>Send transactional emails, such as password resets and account verifications.</li>
            <li>Analyze usage patterns to improve the performance and user experience of our website.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">4. Data Sharing & Third-Party Services</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            We do not sell, rent, or trade your personal information. We only share information with trusted third-party service providers that assist us in operating our website, conducting our business, or serving our users. These include:
          </p>
          <ul className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%] list-disc pl-[24px] flex flex-col gap-[8px]">
            <li><strong>Database & Hosting Providers:</strong> To securely store user accounts and session data.</li>
            <li><strong>Cloud Storage Providers:</strong> To temporarily hold and process file conversions.</li>
            <li><strong>Email Providers:</strong> To deliver transactional emails.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">5. Data Security & Retention</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            We implement industry-standard security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure. 
          </p>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            <strong>File Retention:</strong> SVGs you upload and the resulting PNGs are processed temporarily. We do not permanently store your converted files on our servers. They are automatically purged from our systems shortly after your session ends or the conversion is downloaded.
          </p>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">6. Cookies and Similar Technologies</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            We use cookies and similar tracking technologies to track activity on our service and hold certain information, primarily to keep you logged in securely and to understand how the site is used. You can instruct your browser to refuse all cookies, but doing so may limit your ability to use certain features.
          </p>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">7. Your Rights</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            Depending on your location, you may have rights regarding your personal information, including the right to access, correct, or delete the personal information we have collected about you. You can update your account information by logging in, or you may contact us directly to request data deletion.
          </p>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">8. Changes to This Privacy Policy</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
          </p>
        </section>

        <section className="flex flex-col gap-[16px]">
          <h2 className="font-heading font-semibold text-[24px] text-[#353A3E]">9. Contact Us</h2>
          <p className="font-body font-normal text-[16px] text-[#5A524C] leading-[160%]">
            If you have any questions or concerns about this Privacy Policy, please contact us at privacy@crushsvg.com.
          </p>
        </section>

      </article>
    </div>
  );
}
