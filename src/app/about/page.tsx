import React from "react";
import Link from "next/link";
import { constructMetadata, SITE_URL } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";

export const metadata = constructMetadata({
  title: "About Us | CrushSVG - Built by The Nevon",
  description: "Learn more about CrushSVG, our mission to provide pixel-perfect SVG to PNG conversions, and the team at The Nevon behind the platform.",
  canonicalPath: "/about",
  keywords: [
    "about crush svg",
    "crushsvg team",
    "who made crush svg",
    "svg converter mission",
    "The Nevon CrushSVG",
    "The Nevon products",
    "CrushSVG creators",
  ],
});

export default function AboutUsPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${SITE_URL}/about#webpage`,
    name: "About Us | CrushSVG - Built by The Nevon",
    url: `${SITE_URL}/about`,
    description: "Learn more about CrushSVG, our mission to provide pixel-perfect SVG to PNG conversions, and the team at The Nevon behind the platform.",
    publisher: {
      "@type": "Organization",
      name: "The Nevon",
      url: "https://www.thenevon.com",
    },
    isPartOf: {
      "@type": "WebSite",
      name: "CrushSVG",
      url: SITE_URL,
    },
  };

  const teamMembers = [
    {
      name: "Sardar Muhammad Nadir",
      role: "CEO and Founder",
      bio: "Full-stack architect specializing in performance optimization, graphics rendering engines, and modern web applications.",
      initials: "SN",
    },
    {
      name: "Muhammad Aswad Khan",
      role: "Project Manager",
      bio: "Product strategist focused on developer experience, user interface design, and scaling digital tools at The Nevon.",
      initials: "AK",
    },
  ];

  return (
    <div className="w-full flex flex-col items-center md:pb-[60px] min-h-[60vh]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />

      {/* Hero Section */}
      <Hero
        badge="Part of The Nevon Suite"
        title={<>About <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">CrushSVG</span></>}
        subtitle="From SVG to PNG, exactly as intended. We built CrushSVG to solve the frustration of broken assets, dropped styles, and missing fonts during vector-to-raster conversion."
        className="mb-[24px] md:mb-[60px]"
      />

      {/* Content Sections */}
      <div className="w-full max-w-[800px] flex flex-col gap-[32px] md:gap-[48px]">
        
        {/* Our Mission */}
        <div className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            Our Mission
          </h2>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6] mb-4">
            Our mission is simple: to deliver the most accurate, reliable, and hassle-free <Link href="/" className="text-brand-primary hover:underline font-medium">SVG to PNG conversion tool</Link> on the web. We understand how frustrating it is when carefully crafted SVG designs lose their patterns, custom web fonts, or alignments when converting to raster formats.
          </p>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">
            Whether you need crisp PNGs for email campaigns, high-res previews for design reviews, or assets ready for web deployment, CrushSVG eliminates conversion quirks completely. Check out our in-depth <Link href="/svg-guides" className="text-brand-primary hover:underline font-medium">SVG Guides & Best Practices</Link> to learn how to prepare your vectors.
          </p>
        </div>

        {/* Built by The Nevon */}
        <div className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-[16px]">
            <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark">
              Built by The Nevon
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#F8F5F2] text-text-muted">Parent Company</span>
          </div>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6] mb-4">
            CrushSVG is designed, engineered, and maintained by <a href="https://www.thenevon.com" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline font-medium">The Nevon</a> — a modern technology and digital product studio dedicated to crafting high-utility software, developer toolkits, and creative digital solutions.
          </p>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">
            At The Nevon, we focus on engineering clean, privacy-conscious tools that streamline everyday workflows without bloated subscriptions or intrusive tracking. CrushSVG was born out of our own internal need for a faithful rasterizer for complex UI vector assets.
          </p>
        </div>

        {/* What We Do */}
        <div className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            How CrushSVG Works
          </h2>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6] mb-4">
            CrushSVG is a lightning-fast converter that transforms Scalable Vector Graphics into pixel-perfect PNGs. We utilize advanced rendering pipelines to ensure that complex CSS filters, inline SVG images, linear/radial gradients, and custom web fonts are rendered with 100% fidelity.
          </p>
          <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">
            Because we respect your privacy, conversion processing happens securely in your browser session without storing your source artwork on our servers. Have questions? Browse our <Link href="/help" className="text-brand-primary hover:underline font-medium">Help & FAQ</Link> or visit our <Link href="/support" className="text-brand-primary hover:underline font-medium">Support Center</Link>.
          </p>
        </div>

        {/* Meet the Team */}
        <div className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-[24px]">
            <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark">
              Meet the Core Team
            </h2>
            <Link href="/team" className="text-sm font-semibold text-brand-primary hover:underline">
              View Full Team &rarr;
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamMembers.map((member) => (
              <div key={member.name} className="flex flex-col p-5 rounded-[12px] bg-[#FCFBF9] border border-[#F2EDE8]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary text-white font-heading font-semibold flex items-center justify-center text-lg shadow-sm">
                    {member.initials}
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-text-dark text-base md:text-lg">{member.name}</h3>
                    <p className="text-xs md:text-sm font-medium text-brand-primary">{member.role}</p>
                  </div>
                </div>
                <p className="font-afacad text-sm text-text-muted leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Our Approach */}
        <div className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            Our Core Principles
          </h2>
          <ul className="flex flex-col gap-[16px]">
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Simplicity First</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">No mandatory installations, no bloated setups. Just paste, configure dimensions, and export instantly.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Uncompromising Fidelity</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">We preserve transparent backgrounds, anti-aliased curves, and true colors up to 16x scaling.</span>
              </div>
            </li>
            <li className="flex gap-[12px] items-start">
              <div className="mt-[6px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0"></div>
              <div>
                <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">Privacy by Design</strong>
                <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">Your SVGs and designs are your intellectual property. We never persist or sell your vector data.</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full max-w-[800px] flex flex-col items-center text-center mt-[48px] md:mt-[60px] p-[32px] md:p-[48px] bg-[#FCF1ED] rounded-[24px] border border-[#F2EDE8]">
        <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[12px]">
          Ready to convert your SVGs?
        </h2>
        <p className="font-afacad text-[16px] md:text-[18px] text-text-muted mb-[24px] max-w-[500px]">
          Experience true pixel-perfect conversion. Try it free or reach out if you have custom needs.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            href="/"
            className="flex items-center justify-center px-[32px] h-[48px] rounded-[12px] bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bricolage font-semibold text-[16px] hover:opacity-90 transition-opacity"
          >
            Start Converting Free
          </Link>
          <Link 
            href="/contact-us"
            className="flex items-center justify-center px-[28px] h-[48px] rounded-[12px] bg-white border border-[#E5DFDA] text-text-dark font-bricolage font-semibold text-[16px] hover:bg-gray-50 transition-colors"
          >
            Contact the Team
          </Link>
        </div>
      </div>
      
    </div>
  );
}
