import React from "react";
import type { Metadata } from "next";
import { constructMetadata, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "SVG Guides & Best Practices | CrushSVG",
  description: "Comprehensive guides, tips, and best practices for working with SVG files, optimizing vector graphics, and preparing them for pixel-perfect PNG conversion.",
  canonicalPath: "/svg-guides",
});

export default function SvgGuidesPage() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "SVG Guides & Best Practices",
    description: "Everything you need to know about Scalable Vector Graphics, from basic concepts to advanced optimization.",
    url: `${SITE_URL}/svg-guides`,
    publisher: {
      "@type": "Organization",
      name: "CrushSVG",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/CrushSVG-logo.svg`,
      },
    },
  };

  return (
    <div className="w-full flex flex-col items-center md:py-[60px] min-h-[60vh]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center max-w-[800px] mb-[16px] md:mb-[60px]">
        <h1 className="font-heading font-semibold text-[30px] leading-[36px] md:text-[56px] md:leading-[61px] tracking-[0.04em] text-text-dark mb-[8px] md:mb-[16px]">
          SVG <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">Guides</span>
        </h1>
        <p className="font-afacad text-[16px] md:text-[20px] text-text-muted leading-[1.5] max-w-[600px]">
          Everything you need to know about Scalable Vector Graphics, from basic concepts to advanced optimization and perfect conversions.
        </p>
      </div>

      {/* Content Sections */}
      <div className="w-full max-w-[800px] flex flex-col gap-[32px] md:gap-[48px]">
        
        {/* 1. What is an SVG? */}
        <section className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            1. What is an SVG?
          </h2>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">
            <strong>Scalable Vector Graphics (SVG)</strong> is an XML-based image format for two-dimensional graphics. Unlike raster image formats (such as JPEG or PNG) that store information in a grid of colored pixels, SVGs store image data as mathematical formulas. This means SVGs can be scaled up or down infinitely without losing quality or becoming pixelated.
          </p>
        </section>

        {/* 2. SVG vs PNG */}
        <section className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            2. SVG vs PNG: When to use which?
          </h2>
          <ul className="flex flex-col gap-[16px]">
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Use SVG for:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Logos, icons, UI elements, simple illustrations, and anything that needs to look crisp on high-resolution displays or be animated via CSS/JavaScript.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Use PNG for:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Complex images, photographs, detailed artwork with millions of colors, or when you need strict rendering compatibility across email clients and older systems.</span>
              </div>
            </li>
          </ul>
        </section>

        {/* 3. How to optimize SVG files */}
        <section className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            3. How to Optimize SVG Files
          </h2>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6] mb-[16px]">
            Vector editors like Illustrator or Figma often export SVGs with a lot of unnecessary metadata, hidden layers, and empty groups. To reduce file size:
          </p>
          <ul className="flex flex-col gap-[16px]">
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Remove editor-specific metadata and unused <code>{"<defs>"}</code>.</span>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Round coordinate numbers (e.g., using 1 decimal place instead of 5).</span>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Use optimization tools like SVGO (or web interfaces like SVGOMG) before putting SVGs into production.</span>
            </li>
          </ul>
        </section>

        {/* 4. How to use SVG on websites */}
        <section className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            4. Using SVGs on Websites
          </h2>
          <ul className="flex flex-col gap-[16px]">
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">As an <code>{"<img>"}</code> tag:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">The simplest method, but prevents you from interacting with the SVG&apos;s internal elements via CSS or JavaScript.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Inline SVG:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Pasting the raw SVG code directly into your HTML allows full control over styling (like changing `fill` colors on hover).</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">CSS Backgrounds:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Good for decorative patterns. Ensure the SVG is URL-encoded or base64 converted for compatibility.</span>
              </div>
            </li>
          </ul>
        </section>

        {/* 5. SVG Best Practices */}
        <section className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            5. SVG Best Practices
          </h2>
          <ul className="flex flex-col gap-[16px]">
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]"><strong>Always include a viewBox:</strong> A `viewBox` attribute ensures your SVG scales responsively inside its container. Avoid relying solely on fixed `width` and `height`.</span>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]"><strong>Convert text to outlines:</strong> If your SVG relies on custom fonts, convert text to paths before exporting so it renders perfectly on any device without missing fonts.</span>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]"><strong>Add accessibility tags:</strong> Use <code>{"<title>"}</code> and <code>{"<desc>"}</code> tags inside your SVG so screen readers can properly interpret your visual content.</span>
            </li>
          </ul>
        </section>

        {/* 6. Common Problems & Solutions */}
        <section className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            6. Common Problems & Solutions
          </h2>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6] mb-[16px]">
            SVGs can sometimes be tricky when rendering in different environments (like email clients or strict markdown files).
          </p>
          <ul className="flex flex-col gap-[16px]">
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Missing Fonts:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">If a font doesn&apos;t load, your design will look broken. Solution: Embed the font as base64, or convert the text layers to vector paths.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Broken Patterns or Filters:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Some systems block advanced SVG features (like <code>{"<filter>"}</code> or <code>{"<pattern>"}</code>) for security reasons.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">The Ultimate Fix: Convert to PNG</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">If your environment strictly rejects SVGs or breaks their rendering, the safest fallback is converting it to a high-quality raster image. Use our <strong>CrushSVG Converter</strong> on the homepage to generate a pixel-perfect PNG exactly as intended.</span>
              </div>
            </li>
          </ul>
        </section>

      </div>
    </div>
  );
}
