import React from "react";
import Link from "next/link";
import { constructMetadata, SITE_URL } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "About Us | CrushSVG",
  description: "Learn more about CrushSVG and our mission to provide pixel-perfect SVG to PNG conversions.",
  canonicalPath: "/about",
});

export default function AboutUsPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Us | CrushSVG",
    url: `${SITE_URL}/about`,
    description: "Learn more about CrushSVG and our mission to provide pixel-perfect SVG to PNG conversions.",
  };

  return (
    <div className="w-full flex flex-col items-center md:py-[60px] min-h-[60vh]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />

      
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center max-w-[800px] mb-[40px] md:mb-[60px]">
        <h1 className="font-heading font-semibold text-[32px] leading-[40px] md:text-[56px] md:leading-[61px] tracking-[0.04em] text-text-dark mb-[16px]">
          About <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">Us</span>
        </h1>
        <p className="font-afacad text-[16px] md:text-[20px] text-text-muted leading-[1.5] max-w-[600px]">
          From SVG to PNG, Exactly as Intended. We built CrushSVG to solve the frustration of broken assets and missing details during conversion.
        </p>
      </div>

      {/* Content Sections */}
      <div className="w-full max-w-[800px] flex flex-col gap-[32px] md:gap-[48px]">
        
        {/* Our Mission */}
        <div className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            Our Mission
          </h2>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">
            Our mission is simple: to provide the most accurate, reliable, and hassle-free SVG to PNG conversion tool on the web. We understand how frustrating it is when your carefully crafted SVG designs lose their patterns, fonts, or alignments when converting to raster formats. CrushSVG exists to eliminate that problem completely.
          </p>
        </div>

        {/* What We Do */}
        <div className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            What We Do
          </h2>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">
            CrushSVG is a lightning-fast, browser-based converter that transforms your Scalable Vector Graphics into pixel-perfect PNGs. We utilize advanced rendering engines to ensure that everything from complex CSS filters and inline images to custom fonts is captured exactly as you designed it.            </p>
        </div>

        {/* Why Choose Us */}
        <div className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            Our Approach
          </h2>
          <ul className="flex flex-col gap-[16px]">
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Simplicity First</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">No installation, no complicated settings. Just drag, drop, and download.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Uncompromising Quality</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">We preserve transparent backgrounds and crisp edges, ensuring your assets are ready for production.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Fast Workflow</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Built for designers and developers who need quick results without sacrificing accuracy.</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full max-w-[800px] flex flex-col items-center text-center mt-[60px] p-[40px] bg-[#FCF1ED] rounded-[24px] border border-[#F2EDE8]">
        <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[12px]">
          Ready to convert your SVGs?
        </h2>
        <p className="font-afacad text-[16px] md:text-[18px] text-text-muted mb-[24px]">
          Experience the difference of a truly pixel-perfect conversion.
        </p>
        <Link 
          href="/"
          className="flex items-center justify-center px-[32px] h-[48px] rounded-[12px] bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bricolage font-semibold text-[16px] hover:opacity-90 transition-opacity"
        >
          Start Converting Now
        </Link>
      </div>
      
    </div>
  );
}
