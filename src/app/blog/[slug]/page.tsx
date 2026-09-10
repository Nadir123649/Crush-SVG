import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Blog } from "@/lib/database/models/blog";
import { constructMetadata, SITE_URL, getBreadcrumbSchema, getFAQSchema } from "@/lib/seo";
import { BlogCard } from "@/components/ui/BlogCard";
import { BlogCoverVisual } from "@/components/blog/BlogCoverVisual";
import { BlogShareBar } from "@/components/blog/BlogShareBar";
import { BlogFAQSection } from "@/components/blog/BlogFAQSection";
import { AdBanner } from "@/components/ui/AdBanner";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface BlogPostProps {
  params: Promise<{ slug: string }>;
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

async function getPostBySlug(slug: string) {
  try {
    const doc = await Blog.findOne({ slug, published: true })
      .populate("authorId", "displayName")
      .lean();

    if (!doc) return null;

    return {
      slug: doc.slug,
      title: doc.title,
      seo_title: doc.title,
      seo_description: doc.excerpt || "",
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
    };
  } catch (error) {
    console.error("Failed to fetch blog post by slug:", error);
    return null;
  }
}

async function getRelatedPosts(currentSlug: string, limit = 3) {
  try {
    const docs = await Blog.find({ published: true, slug: { $ne: currentSlug } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("authorId", "displayName")
      .lean();

    return docs.map((doc) => ({
      slug: doc.slug,
      title: doc.title,
      seo_title: doc.title,
      seo_description: doc.excerpt || "",
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
    console.error("Failed to fetch related posts:", error);
    return [];
  }
}

export async function generateMetadata({ params }: BlogPostProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return constructMetadata({
      title: "Post Not Found | CrushSVG",
      description: "The requested article could not be found.",
      noindex: true,
    });
  }

  const ogImage =
    post.cover_image && post.cover_image !== "/blog.png"
      ? post.cover_image
      : `/blog/${post.slug}/opengraph-image`;

  return constructMetadata({
    title: post.seo_title,
    description: post.seo_description,
    canonicalPath: `/blog/${post.slug}`,
    image: ogImage,
  });
}

export default async function BlogPostDetailPage({ params }: BlogPostProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post.slug, 3);
  const articleUrl = `${SITE_URL}/blog/${post.slug}`;

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

  const breadcrumbsSchema = getBreadcrumbSchema([
    { name: "Home", item: "" },
    { name: "Blog", item: "/blog" },
    { name: post.title, item: `/blog/${post.slug}` },
  ]);

  const faqSchema =
    post.faqs && post.faqs.length > 0 ? getFAQSchema(post.faqs) : null;

  return (
    <main className="w-full flex flex-col items-center min-h-screen bg-background pb-[60px] md:pb-[100px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <article className="w-full max-w-[840px] px-[16px] md:px-[24px] pt-[32px] md:pt-[64px]">
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

        <header className="flex flex-col gap-[14px] md:gap-[16px] mb-[28px] md:mb-[40px] items-center text-center">
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

          <div className="flex items-center gap-[10px] font-body text-[13px] md:text-[14px] text-text-muted">
            <span className="font-semibold text-brand-primary">{post.author}</span>
            <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
            <time dateTime={post.date}>{post.formattedDate || post.date}</time>
            <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
            <span>{post.readTime}</span>
          </div>

          <h1 className="font-heading font-semibold text-[28px] sm:text-[36px] md:text-[46px] leading-[1.18] tracking-[0.03em] text-text-dark max-w-[800px]">
            {post.title}
          </h1>

          <BlogShareBar title={post.title} url={articleUrl} />
        </header>

        <div className="mb-[40px] md:mb-[60px]">
          <BlogCoverVisual
            coverImage={post.cover_image}
            title={post.title}
            category={post.category}
            readTime={post.readTime}
            isLarge={true}
          />
        </div>

        <div
          className="w-full bg-white rounded-[16px] md:rounded-[24px] border border-[#EAEAEA] p-[24px] md:p-[44px] shadow-[0px_4px_40px_rgba(0,0,0,0.04)] prose prose-lg max-w-none
            prose-headings:font-heading prose-headings:text-text-dark prose-headings:tracking-[0.03em]
            prose-h2:text-[22px] prose-h2:md:text-[28px] prose-h2:mt-[40px] prose-h2:mb-[16px] prose-h2:pb-[8px] prose-h2:border-b prose-h2:border-[#FAF6F3]
            prose-h3:text-[18px] prose-h3:md:text-[22px] prose-h3:mt-[28px] prose-h3:mb-[12px]
            prose-p:mb-[20px] prose-p:leading-[1.8] prose-p:text-[#374151]
            prose-li:leading-[1.7] prose-li:text-[#374151]
            prose-strong:font-semibold prose-strong:text-text-dark
            prose-a:text-brand-primary prose-a:font-medium hover:prose-a:underline
            prose-blockquote:border-l-4 prose-blockquote:border-brand-primary prose-blockquote:pl-[18px] prose-blockquote:italic prose-blockquote:text-text-muted prose-blockquote:my-[24px] prose-blockquote:bg-[#FAF6F3] prose-blockquote:p-[16px] prose-blockquote:rounded-r-[10px]
            prose-code:bg-[#FAF6F3] prose-code:text-brand-primary prose-code:px-[6px] prose-code:py-[2px] prose-code:rounded-[4px] prose-code:text-[14px] prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
          "
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {post.faqs && post.faqs.length > 0 && (
          <BlogFAQSection faqs={post.faqs} />
        )}

        <div className="my-[36px] md:my-[56px]">
          <AdBanner />
        </div>

        <div className="mb-[48px] p-[24px] md:p-[40px] rounded-[16px] md:rounded-[24px] bg-[#FAF6F3] border border-[#EAEAEA] flex flex-col sm:flex-row items-center justify-between gap-[20px]">
          <div className="flex flex-col gap-[6px] text-center sm:text-left">
            <span className="text-[12px] font-heading font-semibold uppercase tracking-wider text-brand-primary">
              Instant Solution
            </span>
            <p className="font-heading font-semibold text-text-dark text-[18px] md:text-[22px] tracking-[0.03em]">
              Ready to convert your SVG to PNG?
            </p>
            <p className="font-body text-[14px] text-text-muted">
              Free, browser-based, pixel-perfect. No install, no uploads, no quality loss.
            </p>
          </div>
          <Link
            href="/#converter"
            className="h-[44px] px-[24px] rounded-[8px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white text-[14px] md:text-[15px] font-heading font-medium hover:opacity-90 transition-opacity shrink-0 no-underline flex items-center justify-center"
          >
            Open Converter &rarr;
          </Link>
        </div>

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
                <BlogCard key={related.slug} blog={related as any} />
              ))}
            </div>
          </section>
        )}

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
