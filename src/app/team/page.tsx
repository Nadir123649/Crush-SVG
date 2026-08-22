import React from "react";
import Link from "next/link";
import { constructMetadata, SITE_URL } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Meet the Team | CrushSVG & The Nevon",
  description: "Get to know the engineers and product designers behind CrushSVG and The Nevon dedicated to building fast, high-utility developer tools.",
  canonicalPath: "/team",
  keywords: [
    "CrushSVG team",
    "The Nevon team",
    "Sardar Muhammad Nadir",
    "Muhammad Aswad Khan",
    "CrushSVG creators",
    "SVG tool creators",
  ],
});

export default function TeamPage() {
  const teamSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${SITE_URL}/team#webpage`,
    name: "Meet the Team | CrushSVG & The Nevon",
    url: `${SITE_URL}/team`,
    description: "Get to know the team behind CrushSVG and The Nevon.",
    publisher: {
      "@type": "Organization",
      name: "The Nevon",
      url: "https://www.thenevon.com",
    },
  };

  const team = [
    {
      name: "Sardar Muhammad Nadir",
      role: "Lead Engineer & Co-Founder",
      bio: "Full-stack architect with a focus on web performance, client-side rendering engines, and scalable SaaS infrastructure. Nadir leads technical development at The Nevon and engineered CrushSVG's vector rasterization pipeline.",
      initials: "SN",
      skills: ["Next.js", "TypeScript", "Canvas/WebAssembly", "Cloud Infrastructure"],
    },
    {
      name: "Muhammad Aswad Khan",
      role: "Product Lead & Co-Founder",
      bio: "Product strategist and interface designer dedicated to crafting friction-free digital experiences. Aswad oversees product roadmap, UX architecture, and developer relations across The Nevon product suite.",
      initials: "AK",
      skills: ["Product Strategy", "UI/UX Architecture", "SEO & Growth", "Design Systems"],
    },
  ];

  return (
    <div className="w-full flex flex-col items-center md:py-[60px] min-h-[60vh]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(teamSchema) }}
      />

      {/* Hero Section */}
      <div className="flex flex-col items-center text-center max-w-[800px] mb-[32px] md:mb-[60px]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCF1ED] text-brand-primary text-sm font-semibold mb-4 border border-[#F2EDE8]">
          <span>The Creators</span>
        </div>
        <h1 className="font-heading font-semibold text-[30px] leading-[36px] md:text-[56px] md:leading-[61px] tracking-[0.04em] text-text-dark mb-[8px] md:mb-[16px]">
          Meet the <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">Team</span>
        </h1>
        <p className="font-afacad text-[16px] md:text-[20px] text-text-muted leading-[1.5] max-w-[620px]">
          We are builders, engineers, and designers from <a href="https://www.thenevon.com" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline font-medium">The Nevon</a> creating purposeful tools that eliminate daily friction for developers and creatives.
        </p>
      </div>

      {/* Team Grid */}
      <div className="w-full max-w-[900px] grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {team.map((member) => (
          <div
            key={member.name}
            className="flex flex-col bg-white rounded-[20px] p-6 md:p-8 border border-[#F2EDE8]"
            style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}
          >
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-secondary text-white font-heading font-bold flex items-center justify-center text-2xl shadow-sm">
                {member.initials}
              </div>
              <div>
                <h2 className="font-heading font-semibold text-xl text-text-dark">{member.name}</h2>
                <p className="text-sm font-semibold text-brand-primary">{member.role}</p>
                <p className="text-xs text-text-muted mt-0.5">The Nevon & CrushSVG</p>
              </div>
            </div>

            <p className="font-afacad text-[15px] md:text-[16px] text-text-muted leading-[1.6] mb-6 flex-1">
              {member.bio}
            </p>

            <div className="pt-4 border-t border-[#F2EDE8]">
              <p className="text-xs font-semibold text-text-dark uppercase tracking-wider mb-2">Focus Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {member.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs px-2.5 py-1 rounded-md bg-[#FBF9F7] border border-[#EFE9E4] text-text-dark font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Parent Organization Highlight */}
      <div className="w-full max-w-[900px] flex flex-col bg-white rounded-[20px] p-6 md:p-10 border border-[#F2EDE8] mb-12" style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-[550px]">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary block mb-1">Our Parent Studio</span>
            <h3 className="font-heading font-semibold text-2xl text-text-dark mb-3">The Nevon</h3>
            <p className="font-afacad text-[16px] text-text-muted leading-relaxed">
              The Nevon builds software products, developer utilities, and web platforms designed around speed, reliability, and precision. CrushSVG is part of our commitment to accessible, ad-free web tooling.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <a
              href="https://www.thenevon.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-6 h-11 rounded-xl bg-[#FCF1ED] text-brand-primary font-semibold text-sm hover:bg-[#FBE8E0] transition-colors"
            >
              Visit The Nevon &rarr;
            </a>
            <Link
              href="/about"
              className="flex items-center justify-center px-6 h-11 rounded-xl bg-white border border-[#E5DFDA] text-text-dark font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              About Our Story
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full max-w-[900px] flex flex-col items-center text-center p-8 md:p-12 bg-[#FCF1ED] rounded-[24px] border border-[#F2EDE8]">
        <h2 className="font-heading font-semibold text-2xl md:text-3xl text-text-dark mb-2">
          Want to connect or have feedback?
        </h2>
        <p className="font-afacad text-base md:text-lg text-text-muted mb-6 max-w-[500px]">
          We love hearing how designers and developers use CrushSVG in their daily workflows.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            href="/contact-us"
            className="flex items-center justify-center px-8 h-12 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bricolage font-semibold text-base hover:opacity-90 transition-opacity"
          >
            Get In Touch
          </Link>
          <Link 
            href="/"
            className="flex items-center justify-center px-6 h-12 rounded-xl bg-white border border-[#E5DFDA] text-text-dark font-bricolage font-semibold text-base hover:bg-gray-50 transition-colors"
          >
            Try the Converter
          </Link>
        </div>
      </div>
    </div>
  );
}
