import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { constructMetadata, SITE_URL } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = constructMetadata({
  title: "SVG Guides & Best Practices | CrushSVG",
  description: "Comprehensive guides, tips, and best practices for working with SVG files, optimizing vector graphics, and preparing them for pixel-perfect PNG conversion.",
  canonicalPath: "/svg-guides",
  keywords: [
    "svg guides",
    "svg best practices",
    "how to optimize svg",
    "convert svg to png tutorial",
    "svg vector tips",
    "crush svg guide",
    "svg troubleshooting",
    "figma to png",
    "svg in email",
  ],
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

  const tableOfContents = [
    { id: "what-is-svg", label: "1. What is an SVG?" },
    { id: "svg-vs-png", label: "2. SVG vs PNG: When to use which?" },
    { id: "optimize-svg", label: "3. How to Optimize SVG Files" },
    { id: "use-on-web", label: "4. Using SVGs on Websites" },
    { id: "best-practices", label: "5. SVG Best Practices" },
    { id: "common-problems", label: "6. Common Problems & Solutions" },
    { id: "svg-to-png-email", label: "7. How to Convert SVG to PNG for Outlook & Gmail" },
    { id: "figma-svg-to-transparent-png", label: "8. Exporting Figma SVGs as Transparent PNG" },
    { id: "why-svg-not-showing-gmail", label: "9. Why SVGs Fail in Email Clients" },
  ];

  return (
    <div className="w-full flex flex-col items-center md:pb-[60px] min-h-[60vh]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* Hero Section */}
      <Hero
        badge="Developer & Designer Documentation"
        title={<>SVG <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">Guides</span></>}
        subtitle={<>Everything you need to know about Scalable Vector Graphics, from fundamental optimization to flawless raster conversions with <Link href="/" className="text-brand-primary hover:underline font-medium">CrushSVG</Link>.</>}
        className="mb-[24px] md:mb-[40px]"
      />

      {/* Table of Contents Quick Nav */}
      <div className="w-full max-w-[800px] bg-white rounded-[16px] p-6 md:p-8 border border-[#F2EDE8] mb-8" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
        <h2 className="font-heading font-semibold text-lg md:text-xl text-text-dark mb-4 flex items-center gap-2">
          <span>Table of Contents</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {tableOfContents.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-sm font-afacad text-text-muted hover:text-brand-primary hover:underline transition-colors py-1 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Content Sections */}
      <div className="w-full max-w-[800px] flex flex-col gap-[32px] md:gap-[48px]">
        
        {/* 1. What is an SVG? */}
        <section id="what-is-svg" className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8] scroll-mt-24" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            1. What is an SVG?
          </h2>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">
            <strong>Scalable Vector Graphics (SVG)</strong> is an XML-based image format for two-dimensional graphics. Unlike raster image formats (such as JPEG or PNG) that store information in a grid of colored pixels, SVGs store image data as mathematical formulas. This means SVGs can be scaled up or down infinitely without losing quality or becoming pixelated.
          </p>
        </section>

        {/* 2. SVG vs PNG */}
        <section id="svg-vs-png" className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8] scroll-mt-24" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
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
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Complex images, photographs, detailed artwork with millions of colors, or when you need strict rendering compatibility across email clients and older systems. When you need a reliable fallback, use our <Link href="/" className="text-brand-primary hover:underline font-semibold">SVG to PNG converter</Link>.</span>
              </div>
            </li>
          </ul>
        </section>

        {/* 3. How to optimize SVG files */}
        <section id="optimize-svg" className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8] scroll-mt-24" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
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
        <section id="use-on-web" className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8] scroll-mt-24" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
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
        <section id="best-practices" className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8] scroll-mt-24" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
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
        <section id="common-problems" className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8] scroll-mt-24" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
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
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">If your environment strictly rejects SVGs or breaks their rendering, the safest fallback is converting it to a high-quality raster image. Use our <Link href="/" className="text-brand-primary font-semibold hover:underline">CrushSVG Converter</Link> on the homepage to generate a pixel-perfect PNG exactly as intended.</span>
              </div>
            </li>
          </ul>

          {/* Quick Tool Callout Banner */}
          <div className="mt-8 p-6 rounded-2xl bg-[#FCF1ED] border border-[#F2EDE8] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-heading font-semibold text-text-dark text-base">Have an SVG causing conversion issues?</p>
              <p className="font-afacad text-sm text-text-muted">Test it directly in our client-side sandbox converter with custom scale factors.</p>
            </div>
            <Link
              href="/#converter"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
            >
              Open Converter &rarr;
            </Link>
          </div>
        </section>

        {/* 7. How to Convert SVG to PNG for Outlook & Gmail Emails */}
        <section id="svg-to-png-email" className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8] scroll-mt-24" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            7. How to Convert SVG to PNG for Outlook & Gmail Emails
          </h2>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6] mb-[16px]">
            Email clients like <strong>Outlook, Gmail, Apple Mail, and Yahoo Mail</strong> have very limited SVG support. Most of them either block SVGs entirely or render them incorrectly — showing broken images, missing fonts, or invisible graphics. The only reliable solution is to <strong>convert your SVG to a PNG before embedding it in an email</strong>.
          </p>
          <ul className="flex flex-col gap-[16px]">
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Why Outlook blocks SVGs:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Outlook uses Microsoft Word&apos;s rendering engine, which does not support the SVG format. Any SVG will show as a broken image or be completely invisible.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Gmail&apos;s SVG restriction:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Gmail strips SVG tags for security reasons. Your icon or illustration will simply disappear in the inbox.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">The fix - Use CrushSVG:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Paste or upload your SVG on <Link href="/" className="text-brand-primary font-medium hover:underline">CrushSVG</Link>. Set a high resolution (e.g. 2x scale for retina displays), click Convert, and download the PNG. Then embed it in your email template using a standard <code className="bg-[#F5F5F5] px-[4px] rounded text-[14px]">{`<img>`}</code> tag with a descriptive alt attribute.</span>
              </div>
            </li>
          </ul>
        </section>

        {/* 8. How to Export SVG from Figma as a Transparent PNG */}
        <section id="figma-svg-to-transparent-png" className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8] scroll-mt-24" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            8. How to Export SVG from Figma as Transparent PNG
          </h2>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6] mb-[16px]">
            Figma is the go-to design tool for most teams today, but exporting a Figma SVG as a <strong>high-resolution transparent PNG</strong> with all styles preserved requires a few careful steps.
          </p>
          <ul className="flex flex-col gap-[16px]">
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Step 1 - Export as SVG from Figma:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Select your frame or component in Figma. Go to the right panel → Export → choose <strong>SVG</strong> format. Make sure &quot;Include id attribute&quot; is unchecked to keep the file clean.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Step 2 - Convert on CrushSVG:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Upload your exported SVG file to <Link href="/" className="text-brand-primary font-medium hover:underline">CrushSVG</Link>. The transparent background is preserved automatically - no extra steps needed. Set your desired width, height, or scale factor for retina-ready output.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Step 3 - Download your PNG:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Download the crisp transparent PNG. It will retain all gradients, shadows, masks, and effects exactly as designed in Figma - ready for presentations, websites, or email templates. Need assistance? Visit our <Link href="/support" className="text-brand-primary hover:underline">Support Center</Link>.</span>
              </div>
            </li>
          </ul>
        </section>

        {/* 9. Why SVG Does Not Display in Gmail or HTML Emails */}
        <section id="why-svg-not-showing-gmail" className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8] scroll-mt-24" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            9. Why SVG Does Not Display in Gmail or HTML Emails
          </h2>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6] mb-[16px]">
            You carefully designed a beautiful SVG logo or icon, but when you send the email - it&apos;s just blank or broken. Here&apos;s exactly why this happens and how to permanently fix it.
          </p>
          <ul className="flex flex-col gap-[16px]">
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Root Cause - Email Security Policies:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">SVG files are XML-based and can embed scripts, animations, and external links. Gmail, Outlook, and many other clients block SVGs entirely to prevent XSS (Cross-Site Scripting) attacks and phishing exploits.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Which clients block SVGs:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Gmail (all platforms), Outlook 2007–2021, Windows Mail, Yahoo Mail, and most mobile email apps do not render SVGs. Only Apple Mail on newer macOS versions has partial support.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">The permanent solution:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Always <strong>convert your SVG to PNG</strong> before using it in any email campaign. Use <Link href="/" className="text-brand-primary font-medium hover:underline">CrushSVG</Link> to generate a pixel-perfect, high-resolution PNG that works in 100% of email clients — including the most strict ones.</span>
              </div>
            </li>
          </ul>
        </section>

      </div>

      {/* Bottom Footer Help Banner */}
      <div className="w-full max-w-[800px] mt-12 p-8 bg-[#FCF1ED] rounded-[24px] border border-[#F2EDE8] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div>
          <h3 className="font-heading font-semibold text-xl text-text-dark mb-1">Still experiencing vector rendering issues?</h3>
          <p className="font-afacad text-sm text-text-muted">Browse our FAQ or reach out to our engineering team for personalized support.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Button
            href="/help"
            variant="outline"
            className="px-5 py-2.5 h-[40px] rounded-xl text-sm font-semibold border border-[#E5DFDA]"
          >
            Help & FAQ
          </Button>
          <Button
            href="/contact-us"
            variant="solid"
            className="px-5 py-2.5 h-[40px] rounded-xl text-sm font-semibold"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}
