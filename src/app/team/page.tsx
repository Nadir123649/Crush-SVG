import React from "react";
import Link from "next/link";
import { constructMetadata, SITE_URL } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { Button } from "@/components/ui/Button";

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
      role: "CEO and Founder",
      bio: "Visionary entrepreneur and tech leader driving the strategic direction of The Nevon. Nadir is focused on building high-impact SaaS products, scaling teams, and establishing CrushSVG as a premier tool in the design and development ecosystem.",
      initials: "SN",
      skills: ["Business Strategy", "Product Vision", "Team Leadership", "Venture Growth"],
    },
    {
      name: "Muhammad Aswad Khan",
      role: "Project Manager",
      bio: "Dedicated project manager bridging the gap between design, engineering, and business goals. Aswad oversees Agile workflows, team coordination, sprint planning, and ensures timely, high-quality delivery across all of The Nevon's initiatives.",
      initials: "AK",
      skills: ["Agile Management", "Sprint Planning", "Team Coordination", "Product Delivery"],
    },
    {
      name: "Muhammad Hassan Irfan",
      role: "Lead Full-Stack Developer & AI Engineer",
      bio: "Full-stack engineer focused on building secure, scalable, and high-performance digital products. Hassan combines deep frontend and backend expertise with modern MERN and Next.js architecture, extensive WordPress experience, and advanced AI prompt engineering to turn complex product requirements into polished, production-ready solutions.",
      initials: "HI",
      skills: ["Full-Stack Engineering", "MERN & Next.js", "AI Engineering", "WordPress"],
    },
    {
      name: "Abdul Raheem",
      role: "Frontend Engineer",
      bio: "Frontend Engineer focused on building responsive, high-performance, and user-friendly digital products. Abdul combines strong frontend development expertise with modern React and Next.js architecture, responsive UI implementation, and a keen eye for detail to turn complex designs and product requirements into polished, scalable, and production-ready interfaces.",
      initials: "AR",
      skills: ["Frontend Architecture", "React & Next.js", "Responsive UI", "System Design"],
    },
    {
      name: "Muhammad Umar",
      role: "Director of Business Development",
      bio: "Driving B2B growth through strategic business development, lead generation, and targeted outreach. Umar focuses on building qualified sales pipelines, client acquisition, and optimizing LinkedIn, email, CRM, and automation-driven outreach systems.",
      initials: "MU",
      skills: ["Business Development", "Lead Generation", "B2B Sales", "Client Acquisition", "Sales Strategy"],
    },
    {
      name: "Mohammad Azan Mehdi",
      role: "Business Development & Lead Generation",
      bio: "Driving B2B growth through targeted lead generation, outbound sales, and automation-powered outreach systems. Azan focuses on building qualified sales pipelines, managing prospecting and client acquisition, and optimizing CRM, LinkedIn, and email outreach workflows.",
      initials: "AM",
      skills: ["Business Development", "Lead Generation", "B2B Sales", "n8n Automation", "CRM & Outreach"],
    },
    {
      name: "Ali Aun",
      role: "QA & Digital Experience Specialist",
      bio: "Turning ideas into polished, scalable products through quality assurance, AI-powered automation, and growth-focused digital strategy. Ali oversees product testing, UI/UX feedback, and content publishing across The Nevon's product suite.",
      initials: "AA",
      skills: ["QA & Testing", "AI Automation", "Content Strategy", "UI/UX Feedback"],
    },
    {
      name: "Mishal",
      role: "UI/UX Designer",
      bio: "Creating intuitive, engaging, and visually refined digital experiences through user-centered design, thoughtful interfaces, and modern design systems. Mishal focuses on transforming product requirements into clean, functional, and user-friendly experiences while maintaining consistency across web and digital products.",
      initials: "M",
      skills: ["UI/UX Design", "User-Centered Design", "Interface Design", "Design Systems", "Wireframing & Prototyping", "Responsive Design", "Visual Design"],
    },
  ];

  return (
    <div className="w-full flex flex-col items-center md:pb-[60px] min-h-[60vh]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(teamSchema) }}
      />

      {/* Hero Section */}
      <Hero
        badge="The Creators"
        title={<>Meet the <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">Team</span></>}
        subtitle={<>We are builders, engineers, and designers from <a href="https://www.thenevon.com" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline font-medium">The Nevon</a> creating purposeful tools that eliminate daily friction for developers and creatives.</>}
        className="mb-[32px] md:mb-[60px]"
      />

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

            <p className="font-afacad text-[16px] md:text-[16px] text-text-muted leading-[1.6] mb-6 flex-1">
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
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="max-w-[550px] flex flex-col items-center text-center lg:items-start lg:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary block mb-1">Our Parent Studio</span>
            <h3 className="font-heading font-semibold text-2xl text-text-dark mb-3">The Nevon</h3>
            <p className="font-afacad text-[16px] text-text-muted leading-relaxed">
              The Nevon builds software products, developer utilities, and web platforms designed around speed, reliability, and precision. CrushSVG is part of our commitment to accessible, ad-free web tooling.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full lg:w-auto">
            <a
              href="https://www.thenevon.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-6 h-11 rounded-[12px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white font-bricolage font-semibold text-[14px] hover:opacity-90 transition-opacity whitespace-nowrap w-full sm:w-auto"
            >
              Visit The Nevon &rarr;
            </a>
            <Button
              href="/about"
              variant="outline"
              className="h-11 px-6 rounded-[12px] font-bricolage font-semibold text-[14px] whitespace-nowrap w-full sm:w-auto"
            >
              About Our Story
            </Button>
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
          <Button 
            href="/contact-us"
            variant="solid"
            className="px-8 h-12 rounded-xl font-bricolage font-semibold text-base"
          >
            Get In Touch
          </Button>
          <Button 
            href="/"
            variant="outline"
            className="px-6 h-12 rounded-xl font-bricolage font-semibold text-base border border-[#E5DFDA]"
          >
            Try the Converter
          </Button>
        </div>
      </div>
    </div>
  );
}
