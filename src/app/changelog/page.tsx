import React from "react";
import Link from "next/link";
import { constructMetadata, SITE_URL } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Changelog & Product Updates | CrushSVG",
  description: "Track all recent features, performance upgrades, and releases for CrushSVG - the free online SVG to PNG converter.",
  canonicalPath: "/changelog",
  keywords: [
    "CrushSVG changelog",
    "CrushSVG updates",
    "SVG converter release notes",
    "CrushSVG features",
  ],
});

export default function ChangelogPage() {
  const changelogSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/changelog#webpage`,
    name: "Changelog & Product Updates | CrushSVG",
    url: `${SITE_URL}/changelog`,
    description: "Track all recent updates, features, and fixes for CrushSVG.",
    publisher: {
      "@type": "Organization",
      name: "The Nevon",
      url: "https://www.thenevon.com",
    },
  };

  const releases = [
    {
      version: "v1.2.0",
      date: "August 2026",
      tag: "Latest",
      title: "Enhanced Structured Data & PWA Offline Engine",
      description: "Comprehensive SEO architecture enhancement, full Google Knowledge Graph support, and PWA service worker caching.",
      changes: [
        { type: "SEO", text: "Added Google WebSite and Organization JSON-LD with Sitelinks Searchbox integration." },
        { type: "Performance", text: "Enabled next-gen AVIF & WebP image compression pipelines." },
        { type: "PWA", text: "Introduced Service Worker caching layer for offline reliability and faster repeat loads." },
        { type: "Security", text: "Implemented strict Content-Security-Policy (CSP) headers across all routes." },
      ],
    },
    {
      version: "v1.1.0",
      date: "July 2026",
      tag: "Feature",
      title: "16x Scale Multipliers & Transparent Background Engine",
      description: "Added ultra-high-resolution rendering options for billboard and print assets, plus full transparent canvas preservation.",
      changes: [
        { type: "Feature", text: "Added up to 16x scaling factor for ultra-crisp vector exports." },
        { type: "UI/UX", text: "Redesigned dimension controls with direct px / cm and preset aspect ratios." },
        { type: "Core", text: "Enhanced font embedding support to prevent missing typography in custom SVGs." },
      ],
    },
    {
      version: "v1.0.0",
      date: "June 2026",
      tag: "Launch",
      title: "CrushSVG Public Launch",
      description: "Initial release of CrushSVG by The Nevon. Free client-side SVG to PNG conversion with zero tracking and fast export.",
      changes: [
        { type: "Core", text: "Live SVG code editor and drag-and-drop vector file upload." },
        { type: "Auth", text: "Optional user accounts for unlimited conversions and saved preferences." },
        { type: "Docs", text: "Published comprehensive SVG Guides covering Figma, Gmail, and vector optimization." },
      ],
    },
  ];

  return (
    <div className="w-full flex flex-col items-center md:py-[60px] min-h-[60vh]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(changelogSchema) }}
      />

      {/* Hero Section */}
      <div className="flex flex-col items-center text-center max-w-[800px] mb-[32px] md:mb-[60px]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCF1ED] text-brand-primary text-sm font-semibold mb-4 border border-[#F2EDE8]">
          <span>Product Updates</span>
        </div>
        <h1 className="font-heading font-semibold text-[30px] leading-[36px] md:text-[56px] md:leading-[61px] tracking-[0.04em] text-text-dark mb-[8px] md:mb-[16px]">
          CrushSVG <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">Changelog</span>
        </h1>
        <p className="font-afacad text-[16px] md:text-[20px] text-text-muted leading-[1.5] max-w-[600px]">
          Follow what we've shipped, fixed, and improved across CrushSVG. Maintained with care by <Link href="/team" className="text-brand-primary hover:underline font-medium">our team</Link> at <a href="https://www.thenevon.com" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline font-medium">The Nevon</a>.
        </p>
      </div>

      {/* Timeline List */}
      <div className="w-full max-w-[800px] flex flex-col gap-8 mb-12">
        {releases.map((rel) => (
          <div
            key={rel.version}
            className="flex flex-col bg-white rounded-[20px] p-6 md:p-8 border border-[#F2EDE8]"
            style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-3">
                <span className="font-heading font-bold text-lg md:text-xl text-text-dark">{rel.version}</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FCF1ED] text-brand-primary border border-[#F5DFD6]">
                  {rel.tag}
                </span>
              </div>
              <span className="text-sm font-medium text-text-muted">{rel.date}</span>
            </div>

            <h2 className="font-heading font-semibold text-xl text-text-dark mb-2">{rel.title}</h2>
            <p className="font-afacad text-[16px] text-text-muted leading-relaxed mb-6">{rel.description}</p>

            <div className="flex flex-col gap-2.5 pt-4 border-t border-[#F2EDE8]">
              {rel.changes.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F8F5F2] text-text-dark mt-0.5 shrink-0">
                    {item.type}
                  </span>
                  <span className="font-afacad text-[15px] text-text-dark leading-normal">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Cross-links Banner */}
      <div className="w-full max-w-[800px] flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-[#FCF1ED] rounded-[20px] border border-[#F2EDE8]">
        <div>
          <h3 className="font-heading font-semibold text-lg text-text-dark">Have a feature request?</h3>
          <p className="font-afacad text-sm text-text-muted">Tell us what tools or SVG optimizations you'd like to see next.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/contact-us"
            className="px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Submit Idea
          </Link>
          <Link
            href="/#converter"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Open Converter
          </Link>
        </div>
      </div>
    </div>
  );
}
