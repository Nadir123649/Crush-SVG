import React from "react";
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link, routing } from "@/i18n/routing";
import { constructLocalizedMetadata, SITE_URL } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { Button } from "@/components/ui/Button";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guides_page" });

  return constructLocalizedMetadata({
    locale,
    routeKey: "/svg-guides",
    title: t("metaTitle"),
    description: t("metaDesc"),
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
}

export default async function SvgGuidesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "guides_page" });

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: t("metaTitle"),
    description: t("metaDesc"),
    url: `${SITE_URL}${locale === "en" ? "/svg-guides" : `/${locale}/svg-guides`}`,
    publisher: {
      "@type": "Organization",
      name: "CrushSVG",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon-512.png`,
      },
    },
  };

  const tableOfContents = [
    { id: "what-is-svg", label: t("toc1") },
    { id: "svg-vs-png", label: t("toc2") },
    { id: "optimize-svg", label: t("toc3") },
    { id: "use-on-web", label: t("toc4") },
    { id: "best-practices", label: t("toc5") },
    { id: "common-problems", label: t("toc6") },
    { id: "svg-to-png-email", label: t("toc7") },
    { id: "figma-svg-to-transparent-png", label: t("toc8") },
    { id: "why-svg-not-showing-gmail", label: t("toc9") },
  ];

  return (
    <div className="w-full flex flex-col items-center md:pb-[60px] min-h-[60vh]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* Hero Section */}
      <Hero
        badge={t("badge")}
        title={<>{t("title").split(" ")[0]} <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">{t("title").split(" ").slice(1).join(" ") || "Guides"}</span></>}
        subtitle={<>{t("subtitle")} <Link href="/" className="text-brand-primary hover:underline font-medium">CrushSVG</Link>.</>}
        className="mb-[24px] md:mb-[40px]"
      />

      {/* Table of Contents Quick Nav */}
      <div className="w-full max-w-[800px] bg-white rounded-[16px] p-6 md:p-8 border border-[#F2EDE8] mb-8" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
        <h2 className="font-heading font-semibold text-lg md:text-xl text-text-dark mb-4 flex items-center gap-2">
          <span>{t("tableOfContents")}</span>
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
              <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Convert shapes to simple paths where possible.</span>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Use optimization tools like SVGO or CrushSVG&apos;s clean rendering pipeline.</span>
            </li>
          </ul>
        </section>

        {/* 4. Using SVGs on Websites */}
        <section id="use-on-web" className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8] scroll-mt-24" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            4. Using SVGs on Websites
          </h2>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6] mb-[16px]">
            There are multiple ways to include SVGs in your web projects:
          </p>
          <ul className="flex flex-col gap-[16px]">
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Inline SVG:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Pastes raw <code>{"<svg>"}</code> markup directly into HTML. Best for CSS styling, color switching, and interactive animations.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">{"<img>"} Tag:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Uses <code>{"<img src=\"icon.svg\">"}</code>. Great for caching and clean markup, but prevents internal SVG styling.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">CSS Background:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Uses <code>background-image: url(&apos;icon.svg&apos;)</code>. Ideal for decorative elements and repeating vector patterns.</span>
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
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Always include a viewBox attribute:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Ensures your vector scales proportionally inside responsive containers and converters.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Convert text to outlines/paths:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Prevents typography fallback when custom fonts aren&apos;t installed on client devices or servers.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Use semantic elements:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Use <code>{"<title>"}</code> and <code>{"<desc>"}</code> for accessibility and screen reader support.</span>
              </div>
            </li>
          </ul>
        </section>

        {/* 6. Common Problems & Solutions */}
        <section id="common-problems" className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8] scroll-mt-24" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            6. Common Problems & Solutions
          </h2>
          <div className="flex flex-col gap-[20px]">
            <div>
              <h3 className="font-heading font-semibold text-[18px] md:text-[20px] text-text-dark mb-[6px]">SVG appears blank or clipped?</h3>
              <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Check if the <code>viewBox</code> matches the bounding coordinates of all internal paths, and ensure no overflow clip-paths are active.</p>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-[18px] md:text-[20px] text-text-dark mb-[6px]">Fonts looking wrong or defaulting to Times New Roman?</h3>
              <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Convert all text nodes to outlines/vectors before exporting, or embed web fonts directly using base64 data URIs in the SVG <code>{"<style>"}</code> block.</p>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-[18px] md:text-[20px] text-text-dark mb-[6px]">Gradients and drop shadows missing?</h3>
              <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Ensure gradient IDs inside <code>{"<defs>"}</code> are unique and correctly referenced via <code>url(#id)</code>.</p>
            </div>
          </div>
        </section>

        {/* 7. How to Convert SVG to PNG for Outlook & Gmail */}
        <section id="svg-to-png-email" className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8] scroll-mt-24" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            7. How to Convert SVG to PNG for Outlook &amp; Gmail
          </h2>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6] mb-4">
            Email clients are notoriously bad at rendering modern web technologies. Most major clients — including <strong>Outlook (all desktop versions)</strong>, <strong>Gmail</strong>, and <strong>Yahoo Mail</strong> — completely strip or block inline and linked SVG images for security and compatibility reasons.
          </p>
          <ul className="flex flex-col gap-[16px]">
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Step 1 — Export at 2x or 3x scale:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">When converting your SVG using CrushSVG, choose 2x or 3x scale multiplier. This ensures your logo and email banners remain razor-sharp on Retina and 4K smartphone screens.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Step 2 — Preserve transparency:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Always export as transparent PNG so your logo blends seamlessly with both light-mode and dark-mode email client themes without an awkward white rectangle.</span>
              </div>
            </li>
          </ul>
        </section>

        {/* 8. Exporting Figma SVGs as Transparent PNG */}
        <section id="figma-svg-to-transparent-png" className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8] scroll-mt-24" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            8. Exporting Figma SVGs as Transparent PNG
          </h2>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6] mb-4">
            Figma makes it easy to design icons and UI components, but sometimes exporting directly to PNG loses fine vector details or custom scaling options:
          </p>
          <ul className="flex flex-col gap-[16px]">
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Option A — Copy as SVG directly:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Select your frame in Figma, right-click &rarr; <em>Copy/Paste as</em> &rarr; <em>Copy as SVG</em>. Paste directly into CrushSVG and export at any custom width or resolution instantly.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Option B — Disable background fill:</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">In Figma&apos;s right panel, uncheck the frame&apos;s background fill eye icon before exporting so the SVG doesn&apos;t include a solid white canvas rectangle.</span>
              </div>
            </li>
          </ul>
        </section>

        {/* 9. Why SVGs Fail in Email Clients */}
        <section id="why-svg-not-showing-gmail" className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8] scroll-mt-24" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            9. Why SVGs Fail in Email Clients
          </h2>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6] mb-4">
            If you&apos;ve sent an HTML newsletter containing an SVG and wondered why customers saw broken image icons, here is the technical explanation:
          </p>
          <ul className="flex flex-col gap-[16px]">
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Security restrictions (XSS vulnerabilities):</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Because SVG files are XML documents that can execute JavaScript via <code>{"<script>"}</code> tags or inline event handlers, email service providers block them by default to protect users against cross-site scripting attacks.</span>
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
          <h3 className="font-heading font-semibold text-xl text-text-dark mb-1">{t("readyConvert")}</h3>
          <p className="font-afacad text-sm text-text-muted">{t("readyConvertDesc")}</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Button
            href="/"
            variant="solid"
            className="px-5 py-2.5 h-[40px] rounded-xl text-sm font-semibold"
          >
            {t("convertNow")}
          </Button>
          <Button
            href="/contact-us"
            variant="outline"
            className="px-5 py-2.5 h-[40px] rounded-xl text-sm font-semibold border border-[#E5DFDA]"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}
