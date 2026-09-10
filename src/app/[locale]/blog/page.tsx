import React from "react";
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { constructLocalizedMetadata, SITE_URL, getBreadcrumbSchema } from "@/lib/seo";
import { Blog, User } from "@/lib/database/db";
import type { BlogDoc } from "@/lib/database/models/blog";
import { Hero } from "@/components/sections/Hero";
import { BlogListing } from "@/components/blog/BlogListing";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog_page" });

  return constructLocalizedMetadata({
    locale,
    routeKey: "/blog",
    title: t("metaTitle"),
    description: t("metaDesc"),
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
}

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

interface BlogPost {
  slug: string;
  title: string;
  seo_title: string;
  seo_description: string;
  description: string;
  excerpt: string;
  date: string;
  formattedDate: string;
  category: string;
  readTime: string;
  author: string;
  cover_image: string;
  accent_color: string;
  content: string;
}

async function getAllPosts(): Promise<BlogPost[]> {
  const docs = await Blog.find({ published: true })
    .sort({ createdAt: -1 })
    .populate("authorId", "displayName")
    .lean();

  return docs.map((doc: BlogDoc & { authorId?: { displayName?: string } }) => {
    const authorName = doc.authorId?.displayName || "CrushSVG Team";
    const date = doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt);
    return {
      slug: doc.slug,
      title: doc.title,
      seo_title: doc.title,
      seo_description: doc.excerpt || "",
      description: doc.excerpt || "",
      excerpt: doc.excerpt || "",
      date: date.toISOString(),
      formattedDate: formatDate(date),
      category: doc.category || "General",
      readTime: calculateReadTime(doc.content),
      author: authorName,
      cover_image: doc.coverImage || "/blog.png",
      accent_color: "#FF6B00",
      content: doc.content,
    };
  });
}

async function getCategories(): Promise<string[]> {
  const docs = await Blog.find({ published: true }).select("category").lean();
  const categories = Array.from(new Set(docs.map((d) => d.category || "General")));
  return ["All", ...categories];
}

export default async function BlogListingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog_page" });

  const posts = await getAllPosts();
  const categories = await getCategories();

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: t("metaTitle"),
    description: t("metaDesc"),
    url: `${SITE_URL}${locale === "en" ? "/blog" : `/${locale}/blog`}`,
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
      description: post.excerpt,
      url: `${SITE_URL}${locale === "en" ? `/blog/${post.slug}` : `/${locale}/blog/${post.slug}`}`,
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
    { name: "Home", item: locale === "en" ? "" : `/${locale}` },
    { name: "Blog", item: locale === "en" ? "/blog" : `/${locale}/blog` },
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
        badge={t("badge")}
        title={
          <>
            {t("heroTitlePrefix")}{" "}
            <span className="text-brand-primary">
              {t("heroTitleHighlight")}
            </span>
          </>
        }
        subtitle={t("heroSubtitle")}
        className="mb-2 md:mb-4"
      />

      {/* Interactive Blog Listing Component */}
      <BlogListing posts={posts} categories={categories} />
    </main>
  );
}
