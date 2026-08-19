import React from "react";
import { ScrollToTop } from "@/components/utils/ScrollToTop";
import Link from "next/link";

export const metadata = {
  title: "Support Center | CrushSVG",
  description: "Get help with SVG conversions, billing, or technical issues at the CrushSVG Support Center.",
};

const faqs = [
  {
    question: "Why does my converted PNG look different from the SVG?",
    answer: "CrushSVG uses a browser-based rendering engine, which accurately supports modern CSS filters and SVG properties. However, if your SVG references external assets (like local fonts or images) that are missing, they may not render correctly. Make sure to embed fonts or use base64 images.",
  },
  {
    question: "What is the maximum file size for SVG uploads?",
    answer: "You can upload SVG files up to 5MB in size. For most vector graphics, this is more than enough. If your file is larger, try optimizing it by removing unnecessary metadata or path points before uploading.",
  },
  {
    question: "Do you keep a copy of my uploaded SVGs?",
    answer: "No. All conversions happen entirely in your browser using our client-side processing. Your files are never uploaded to our servers, ensuring your designs remain 100% private and secure.",
  },
  {
    question: "How do I retain a transparent background?",
    answer: "In the conversion settings, simply check the 'Transparent Background' option before downloading your PNG. Make sure your original SVG doesn't have a solid colored `<rect>` acting as a background layer.",
  }
];

export default function SupportPage() {
  return (
    <div className="w-full flex flex-col items-center md:py-[60px] min-h-[60vh]">
      <ScrollToTop />
      
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center max-w-[800px] mb-[40px] md:mb-[60px]">
        <h1 className="font-heading font-semibold text-[32px] leading-[40px] md:text-[56px] md:leading-[61px] tracking-[0.04em] text-text-dark mb-[16px]">
          Support <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">Center</span>
        </h1>
        <p className="font-afacad text-[16px] md:text-[20px] text-text-muted leading-[1.5] max-w-[600px]">
          How can we help you today? Browse our FAQs or explore our guides to get the most out of CrushSVG.
        </p>
      </div>

      {/* Quick Links Section */}
      <div className="w-full max-w-[800px] grid grid-cols-1 md:grid-cols-2 gap-[24px] mb-[60px]">
        
        {/* Contact Us Card */}
        <Link href="/contact-us" className="group w-full flex flex-col bg-white rounded-[16px] p-[32px] border border-[#F2EDE8] hover:border-brand-primary transition-colors cursor-pointer" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <div className="w-[48px] h-[48px] rounded-full bg-[#FCF1ED] flex items-center justify-center mb-[20px] group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#D94A1E" className="w-[24px] h-[24px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="font-heading font-semibold text-[20px] md:text-[24px] text-text-dark mb-[8px]">
            Contact Us
          </h2>
          <p className="font-afacad text-[15px] md:text-[16px] text-text-muted leading-[1.6]">
            Can&apos;t find the answer? Reach out to our support team for personalized assistance.
          </p>
        </Link>

        {/* SVG Guides Card */}
        <Link href="/svg-guides" className="group w-full flex flex-col bg-white rounded-[16px] p-[32px] border border-[#F2EDE8] hover:border-brand-primary transition-colors cursor-pointer" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <div className="w-[48px] h-[48px] rounded-full bg-[#FCF1ED] flex items-center justify-center mb-[20px] group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#D94A1E" className="w-[24px] h-[24px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h2 className="font-heading font-semibold text-[20px] md:text-[24px] text-text-dark mb-[8px]">
            SVG Guides
          </h2>
          <p className="font-afacad text-[15px] md:text-[16px] text-text-muted leading-[1.6]">
            Learn how to optimize SVGs, fix rendering issues, and get the best results.
          </p>
        </Link>

      </div>

      {/* FAQ Section */}
      <div className="w-full max-w-[800px] flex flex-col">
        <div className="text-center mb-[32px]">
          <h2 className="font-heading font-semibold text-[28px] md:text-[36px] text-text-dark mb-[12px]">
            Frequently Asked Questions
          </h2>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted">
            Quick answers to common questions about CrushSVG.
          </p>
        </div>

        <div className="flex flex-col gap-[16px]">
          {faqs.map((faq, index) => (
            <div key={index} className="w-full bg-white rounded-[12px] p-[24px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
              <h3 className="font-heading font-semibold text-[18px] md:text-[20px] text-text-dark mb-[12px]">
                {faq.question}
              </h3>
              <p className="font-afacad text-[15px] md:text-[16px] text-text-muted leading-[1.6]">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full max-w-[800px] flex flex-col items-center text-center mt-[60px] p-[40px] bg-[#FCF1ED] rounded-[24px] border border-[#F2EDE8]">
        <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[12px]">
          Still have questions?
        </h2>
        <p className="font-afacad text-[16px] md:text-[18px] text-text-muted mb-[24px]">
          Our support team is always here to help you resolve any issues.
        </p>
        <Link 
          href="/contact-us"
          className="flex items-center justify-center px-[32px] h-[48px] rounded-[12px] bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bricolage font-semibold text-[16px] hover:opacity-90 transition-opacity"
        >
          Send Us a Message
        </Link>
      </div>
      
    </div>
  );
}
