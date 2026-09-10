import React from "react";
import type { Metadata } from "next";
import { constructMetadata, SITE_URL, getBreadcrumbSchema } from "@/lib/seo";
import { Blog } from "@/lib/database/models/blog";
import { Hero } from "@/components/sections/Hero";
import { BlogListing } from "@/components/blog/BlogListing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function calculateReadTime(text: string): string {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function getPublishedPosts() {
  try {
    const docs = await Blog.find({ published: true })
      .sort({ createdAt: -1 })
      .populate("authorId", "displayName")
      .lean();

    return docs.map((doc) => ({
      slug: doc.slug,
      title: doc.title,
      seo_title: doc.title,
      seo_description: doc.excerpt || "",
      description: doc.content.replace(/<[^>]*>/g, "").slice(0, 160),
      excerpt: doc.excerpt || doc.content.replace(/<[^>]*>/g, "").slice(0, 160) + "...",
      date: doc.createdAt instanceof Date ? doc.createdAt.toISOString().split("T")[0] : String(doc.createdAt),
      formattedDate: formatDate(new Date(doc.createdAt)),
      category: "Blog",
      readTime: calculateReadTime(doc.content),
      author: (doc.authorId as any)?.displayName || "CrushSVG Team",
      cover_image: doc.coverImage || "/blog.png",
      accent_color: "#FF6B00",
      faqs: [],
      content: doc.content,
    }));
  } catch (error) {
    console.error("Failed to fetch published blog posts:", error);
    return [];
  }
}

function getCategoriesFromPosts(posts: { category: string }[]): string[] {
  const categories = Array.from(new Set(posts.map((p) => p.category)));
  return ["All", ...categories];
}

export default async function BlogListingPage() {
  const posts = await getPublishedPosts();
  const categories = getCategoriesFromPosts(posts);

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

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

      <BlogListing posts={posts as any} categories={categories} />
    </main>
  );
}
