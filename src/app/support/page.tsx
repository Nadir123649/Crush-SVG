import React from "react";
import Link from "next/link";
import { constructMetadata, SITE_URL } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Support Center | CrushSVG",
  description: "Get technical support, troubleshooting steps, and answers for SVG to PNG conversions at the CrushSVG Support Center.",
  canonicalPath: "/support",
  keywords: ["crush svg support", "crushsvg help desk", "svg converter assistance", "crushsvg customer service"],
});

const faqs = [
  {
    question: "Why does my converted PNG look different from the SVG?",
    answer: "CrushSVG uses an accurate browser-based rendering engine supporting modern CSS filters and SVG properties. However, if your SVG references external assets (like local system fonts or linked URLs) that are missing, they may not render correctly. We recommend embedding fonts as base64 or converting text to paths.",
    guideLink: "/svg-guides#common-problems",
    guideText: "Read our Common Problems Guide",
  },
  {
    question: "What is the maximum file size for SVG uploads?",
    answer: "You can upload SVG files up to 5MB in size. For most vector graphics, this is more than enough. If your file is larger, try optimizing it by removing unnecessary editor metadata or decimal precision before uploading.",
    guideLink: "/svg-guides#optimize-svg",
    guideText: "Learn how to optimize SVGs",
  },
  {
    question: "Do you keep a copy of my uploaded SVGs?",
    answer: "No. All conversions happen entirely in your browser using our client-side processing engine. Your files are never uploaded to or stored on our servers, ensuring your designs remain 100% private and secure.",
    guideLink: "/privacy-policy",
    guideText: "Read our Privacy Policy",
  },
  {
    question: "How do I retain a transparent background?",
    answer: "In the conversion controls, ensure the 'Transparent Background' toggle is enabled before exporting your PNG. Make sure your original SVG doesn't include a solid colored background <rect> element.",
    guideLink: "/svg-guides#figma-svg-to-transparent-png",
    guideText: "See transparent PNG guide",
  }
];

export default function SupportPage() {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Support Center | CrushSVG",
    url: `${SITE_URL}/support`,
    description: "Get technical assistance with SVG conversions at the CrushSVG Support Center.",
  };

  return (
    <div className="w-full flex flex-col items-center md:py-[60px] min-h-[60vh]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />

      {/* Hero Section */}
      <div className="flex flex-col items-center text-center max-w-[800px] mb-[32px] md:mb-[48px]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCF1ED] text-brand-primary text-sm font-semibold mb-4 border border-[#F2EDE8]">
          <span>Assistance & Resources</span>
        </div>
        <h1 className="font-heading font-semibold text-[32px] leading-[40px] md:text-[56px] md:leading-[61px] tracking-[0.04em] text-text-dark mb-[16px]">
          Support <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">Center</span>
        </h1>
        <p className="font-afacad text-[16px] md:text-[20px] text-text-muted leading-[1.5] max-w-[600px]">
          How can we help you today? Browse troubleshooting FAQs, explore our vector guides, or message <Link href="/team" className="text-brand-primary hover:underline font-medium">our team</Link> directly.
        </p>
      </div>

      {/* Quick Links Section */}
      <div className="w-full max-w-[800px] grid grid-cols-1 sm:grid-cols-3 gap-[16px] mb-[48px]">
        
        {/* Contact Us Card */}
        <Link href="/contact-us?r=1" className="group flex flex-col bg-white rounded-[16px] p-[24px] border border-[#F2EDE8] hover:border-brand-primary transition-all" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <div className="w-[42px] h-[42px] rounded-full bg-[#FCF1ED] flex items-center justify-center mb-[14px] group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#D94A1E" className="w-[20px] h-[20px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="font-heading font-semibold text-[18px] text-text-dark mb-[6px] group-hover:text-brand-primary transition-colors">
            Contact Support
          </h2>
          <p className="font-afacad text-[14px] text-text-muted leading-[1.5]">
            Direct email and messaging access to our engineering team.
          </p>
        </Link>

        {/* SVG Guides Card */}
        <Link href="/svg-guides" className="group flex flex-col bg-white rounded-[16px] p-[24px] border border-[#F2EDE8] hover:border-brand-primary transition-all" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <div className="w-[42px] h-[42px] rounded-full bg-[#FCF1ED] flex items-center justify-center mb-[14px] group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#D94A1E" className="w-[20px] h-[20px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h2 className="font-heading font-semibold text-[18px] text-text-dark mb-[6px] group-hover:text-brand-primary transition-colors">
            SVG Guides
          </h2>
          <p className="font-afacad text-[14px] text-text-muted leading-[1.5]">
            Best practices for Figma, Gmail, Outlook, and vector compression.
          </p>
        </Link>

        {/* Converter Tool */}
        <Link href="/" className="group flex flex-col bg-white rounded-[16px] p-[24px] border border-[#F2EDE8] hover:border-brand-primary transition-all" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <div className="w-[42px] h-[42px] rounded-full bg-[#FCF1ED] flex items-center justify-center mb-[14px] group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#D94A1E" className="w-[20px] h-[20px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
            </svg>
          </div>
          <h2 className="font-heading font-semibold text-[18px] text-text-dark mb-[6px] group-hover:text-brand-primary transition-colors">
            Live Converter
          </h2>
          <p className="font-afacad text-[14px] text-text-muted leading-[1.5]">
            Convert vector code or uploaded files with up to 16x scaling.
          </p>
        </Link>

      </div>

      {/* FAQ Section */}
      <div className="w-full max-w-[800px] flex flex-col">
        <div className="text-center mb-[28px]">
          <h2 className="font-heading font-semibold text-[26px] md:text-[32px] text-text-dark mb-[8px]">
            Frequently Asked Questions
          </h2>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted">
            Quick answers to common questions about CrushSVG. For more, see our <Link href="/help" className="text-brand-primary hover:underline font-medium">full FAQ page</Link>.
          </p>
        </div>

        <div className="flex flex-col gap-[16px]">
          {faqs.map((faq, index) => (
            <div key={index} className="w-full bg-white rounded-[16px] p-[24px] md:p-[28px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
              <h3 className="font-heading font-semibold text-[18px] md:text-[20px] text-text-dark mb-[10px]">
                {faq.question}
              </h3>
              <p className="font-afacad text-[15px] md:text-[16px] text-text-muted leading-[1.6] mb-3">
                {faq.answer}
              </p>
              {faq.guideLink && (
                <Link href={faq.guideLink} className="text-xs font-semibold text-brand-primary hover:underline inline-flex items-center gap-1">
                  {faq.guideText} &rarr;
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full max-w-[800px] flex flex-col items-center text-center mt-[48px] p-[36px] bg-[#FCF1ED] rounded-[24px] border border-[#F2EDE8]">
        <h2 className="font-heading font-semibold text-[24px] md:text-[30px] text-text-dark mb-[8px]">
          Still have questions?
        </h2>
        <p className="font-afacad text-[16px] md:text-[18px] text-text-muted mb-[20px]">
          Our engineering team at The Nevon is always ready to assist you.
        </p>
        <Link 
          href="/contact-us?r=1"
          className="flex items-center justify-center px-[32px] h-[48px] rounded-[12px] bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bricolage font-semibold text-[16px] hover:opacity-90 transition-opacity shadow-sm"
        >
          Send Us a Message
        </Link>
      </div>
      
    </div>
  );
}
