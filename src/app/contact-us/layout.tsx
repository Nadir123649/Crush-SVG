import type { Metadata } from "next";
import { constructMetadata, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "Contact Us | CrushSVG",
  description: "Get in touch with the CrushSVG team for inquiries, partnership opportunities, bug reports, and customer support.",
  canonicalPath: "/contact-us",
  keywords: ["contact crush svg", "crushsvg contact", "crush svg support email", "svg converter help"],
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact CrushSVG",
    url: `${SITE_URL}/contact-us`,
    description: "Contact page for CrushSVG support and inquiries.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      {children}
    </>
  );
}
