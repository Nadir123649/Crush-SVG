import React from "react";
import type { Metadata } from "next";
import { constructMetadata, SITE_URL, getBreadcrumbSchema } from "@/lib/seo";
import { getAllPosts, getCategories } from "@/lib/blog";
import { Hero } from "@/components/sections/Hero";
import { BlogListing } from "@/components/blog/BlogListing";

export const metadata: Metadata = constructMetadata({
  title: "CrushSVG Blog: Email Marketing & SVG to PNG Guides",
  description:
    "Explore actionable guides, checklists, and tutorials on converting SVG to PNG, fixing broken email images in Outlook and Gmail, and vector optimization.",
  canonicalPath: "/blog",
  keywords: [
    "svg to png blog",
    "email marketing images",
    "fix broken email images outlook",
    "svg in outlook",
    "svg to png converter guide",
    "crushsvg tutorials",
    "retina email graphics",
  ],
});

export default function BlogListingPage() {
  const posts = getAllPosts();
  const categories = getCategories();

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "CrushSVG Blog & Guides",
    description:
      "Expert tips and tutorials on SVG optimization, high-res PNG conversion, and email rendering fixes.",
    url: `${SITE_URL}/blog`,
    publisher: {
      "@type": "Organization",
      name: "CrushSVG",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon-512.png`,
      },
    },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.seo_description || post.excerpt,
      url: `${SITE_URL}/blog/${post.slug}`,
      datePublished: post.date,
      dateModified: post.date,
      author: {
        "@type": "Person",
        name: post.author,
      },
      image: post.cover_image && post.cover_image !== "/blog.png"
        ? `${SITE_URL}${post.cover_image}`
        : `${SITE_URL}/opengraph-image`,
    })),
  };

  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", item: "" },
    { name: "Blog", item: "/blog" },
  ]);

  return (
    <main className="w-full flex flex-col items-center min-h-[70vh] bg-background pb-[60px] md:pb-[100px]">
      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      {/* CrushSVG Branded Hero Section */}
      <Hero
        badge="CrushSVG Blog &amp; Guides"
        title={
          <>
            From Vector to Inbox,{" "}
            <span className="text-brand-primary">
              Tips &amp; Best Practices
            </span>
          </>
        }
        subtitle="Practical guides, checklists, and deep dives on SVG optimization, high-res PNG conversion, and bulletproof image rendering across Outlook and Gmail."
        className="mb-2 md:mb-4"
      />

      {/* Interactive Blog Listing Component */}
      <BlogListing posts={posts} categories={categories} />
    </main>
  );
}
