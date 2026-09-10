import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link, routing } from "@/i18n/routing";
import { Blog, User } from "@/lib/database/db";
import type { BlogDoc } from "@/lib/database/models/blog";
import { constructLocalizedMetadata, SITE_URL, getBreadcrumbSchema, getFAQSchema } from "@/lib/seo";
import { BlogCard } from "@/components/ui/BlogCard";
import { BlogCoverVisual } from "@/components/blog/BlogCoverVisual";
import { BlogShareBar } from "@/components/blog/BlogShareBar";
import { BlogFAQSection } from "@/components/blog/BlogFAQSection";
import { AdBanner } from "@/components/ui/AdBanner";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

interface BlogPostProps {
  params: Promise<{ locale: string; slug: string }>;
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
  faqs?: { question: string; answer: string }[];
  content: string;
}

async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const doc = await Blog.findOne({ slug, published: true })
    .populate("authorId", "displayName")
    .lean();

  if (!doc) return null;

  const authorDoc = doc.authorId as { displayName?: string } | undefined;
  const authorName = authorDoc?.displayName || "CrushSVG Team";
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
}

async function getRelatedPosts(currentSlug: string, category?: string, limit = 3): Promise<BlogPost[]> {
  const filter: Record<string, unknown> = {
    published: true,
    slug: { $ne: currentSlug },
  };
  if (category) {
    filter.category = category;
  }

  let docs = await Blog.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("authorId", "displayName")
    .lean();

  if (category && docs.length < limit) {
    const moreFilter: Record<string, unknown> = {
      published: true,
      slug: { $ne: currentSlug },
      category: { $ne: category },
    };
    const moreDocs = await Blog.find(moreFilter)
      .sort({ createdAt: -1 })
      .limit(limit - docs.length)
      .populate("authorId", "displayName")
      .lean();
    docs = [...docs, ...moreDocs];
  }

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

export async function generateMetadata({ params }: BlogPostProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return constructLocalizedMetadata({
      locale,
      routeKey: `/blog/${slug}`,
      title: "Post Not Found | CrushSVG",
      description: "The requested article could not be found.",
      noindex: true,
    });
  }

  const ogImage =
    post.cover_image && post.cover_image !== "/blog.png"
      ? post.cover_image
      : `/blog/${post.slug}/opengraph-image`;

  return constructLocalizedMetadata({
    locale,
    routeKey: `/blog/${post.slug}`,
    title: `${post.seo_title} | CrushSVG`,
    description: post.seo_description,
    image: ogImage,
  });
}

export default async function BlogPostDetailPage({ params }: BlogPostProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post.slug, post.category, 3);
  const articleUrl = `${SITE_URL}${locale === "en" ? `/blog/${post.slug}` : `/${locale}/blog/${post.slug}`}`;

  // Article Schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seo_description || post.excerpt,
    url: articleUrl,
    datePublished: post.date,
    dateModified: post.date,
    image:
      post.cover_image && post.cover_image !== "/blog.png"
        ? `${SITE_URL}${post.cover_image}`
        : `${SITE_URL}/opengraph-image`,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "CrushSVG",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon-512.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
  };

  // Breadcrumbs Schema
  const breadcrumbsSchema = getBreadcrumbSchema([
    { name: "Home", item: locale === "en" ? "" : `/${locale}` },
    { name: "Blog", item: locale === "en" ? "/blog" : `/${locale}/blog` },
    { name: post.title, item: locale === "en" ? `/blog/${post.slug}` : `/${locale}/blog/${post.slug}` },
  ]);

  return (
    <main className="w-full flex flex-col items-center min-h-screen bg-background pb-[60px] md:pb-[100px]">
      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />

      {/* Article Reading Container */}
      <article className="w-full max-w-[840px] px-[16px] md:px-[24px] pt-[32px] md:pt-[64px]">
        {/* Back Link & Breadcrumb Bar */}
        <div className="flex items-center justify-between gap-4 mb-[20px] md:mb-[28px] text-[13px] md:text-[14px] font-body">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 font-heading font-medium text-brand-primary hover:underline transition-colors"
          >
            <span>&larr;</span>
            <span>Back to all articles</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-text-muted">
            <Link href="/" className="hover:text-text-dark">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-text-dark">Blog</Link>
            <span>/</span>
            <span className="text-text-dark truncate max-w-[200px]">{post.category}</span>
          </div>
        </div>

        {/* Header Section */}
        <header className="flex flex-col gap-[14px] md:gap-[16px] mb-[28px] md:mb-[40px] items-center text-center">
          {/* Animated Category Badge */}
          <div
            style={{
              border: "1px solid transparent",
              background:
                "linear-gradient(#FFFCFA, #FFFCFA) padding-box, linear-gradient(to right, #D94A1E, #FF9A3D) border-box",
            }}
            className="inline-flex items-center gap-[6px] md:gap-[8px] h-[26px] md:h-[29px] rounded-[30px] px-[12px] md:px-[16px] max-w-max"
          >
            <div className="relative flex w-[6px] h-[6px] shrink-0">
              <span className="animate-soft-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-80" />
              <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-brand-primary" />
            </div>
            <span className="font-body font-medium text-[12px] md:text-[13px] text-text-dark whitespace-nowrap">
              {post.category} Guide
            </span>
          </div>

          {/* Meta Information */}
          <div className="flex items-center gap-[10px] font-body text-[13px] md:text-[14px] text-text-muted">
            <span className="font-semibold text-brand-primary">{post.author}</span>
            <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
            <time dateTime={post.date}>{post.formattedDate || post.date}</time>
            <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
            <span>{post.readTime}</span>
          </div>

          {/* Title */}
          <h1 className="font-heading font-semibold text-[28px] sm:text-[36px] md:text-[46px] leading-[1.18] tracking-[0.03em] text-text-dark max-w-[800px]">
            {post.title}
          </h1>

          {/* Social Share Bar */}
          <BlogShareBar title={post.title} url={articleUrl} />
        </header>

        {/* Reusable Visual Cover Box */}
        <div className="mb-[40px] md:mb-[60px]">
          <BlogCoverVisual
            coverImage={post.cover_image}
            title={post.title}
            category={post.category}
            readTime={post.readTime}
            isLarge={true}
          />
        </div>

        {/* HTML Content from TipTap Editor */}
        <div
          className="w-full bg-white rounded-[16px] md:rounded-[24px] border border-[#EAEAEA] p-[24px] md:p-[44px] shadow-[0px_4px_40px_rgba(0,0,0,0.04)] font-body text-[16px] md:text-[17px] leading-[1.8] text-[#374151] space-y-[22px] prose prose-base max-w-none prose-headings:font-heading prose-p:text-[#374151] prose-li:text-[#374151] prose-a:text-brand-primary prose-strong:text-text-dark prose-blockquote:border-l-brand-primary prose-blockquote:text-text-muted prose-code:bg-[#FAF6F3] prose-code:text-brand-primary prose-code:px-[6px] prose-code:py-[2px] prose-code:rounded-[4px] prose-code:text-[14px] prose-code:font-mono"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <section className="mt-[56px] pt-[40px] border-t border-[#EAEAEA]">
            <div className="flex items-center justify-between mb-[20px]">
              <h3 className="font-heading font-semibold text-[22px] md:text-[26px] tracking-[0.03em] text-text-dark">
                Related Articles &amp; Guides
              </h3>
              <Link
                href="/blog"
                className="text-[14px] font-heading font-medium text-brand-primary hover:underline"
              >
                View all &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] md:gap-[20px]">
              {relatedPosts.map((related) => (
                <BlogCard key={related.slug} blog={related} />
              ))}
            </div>
          </section>
        )}

        {/* Bottom Explore Banner */}
        <div className="w-full mt-[40px] p-[24px] md:p-[32px] bg-[#FAF6F3] rounded-[16px] md:rounded-[24px] border border-[#EAEAEA] flex flex-col sm:flex-row items-center justify-between gap-[20px] text-center sm:text-left">
          <div>
            <h4 className="font-heading font-semibold text-[18px] md:text-[20px] text-text-dark mb-[4px]">
              Explore more vector resources
            </h4>
            <p className="font-body text-[14px] text-text-muted">
              Discover SVG optimization best practices, email guides, and converter tutorials.
            </p>
          </div>
          <div className="flex gap-[10px] shrink-0">
            <Button
              href="/blog"
              variant="outline"
              className="px-[16px] py-[8px] h-[38px] rounded-[8px] text-[14px] font-heading font-medium bg-white"
            >
              All Articles
            </Button>
            <Button
              href="/svg-guides"
              variant="solid"
              className="px-[16px] py-[8px] h-[38px] rounded-[8px] text-[14px] font-heading font-medium"
            >
              SVG Guides
            </Button>
          </div>
        </div>
      </article>
    </main>
  );
}
