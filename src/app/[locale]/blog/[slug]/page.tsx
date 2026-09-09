import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link, routing } from "@/i18n/routing";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPostBySlug, getAllPosts, getRelatedPosts } from "@/lib/blog";
import { constructLocalizedMetadata, SITE_URL, getBreadcrumbSchema, getFAQSchema } from "@/lib/seo";
import { BlogCard } from "@/components/ui/BlogCard";
import { BlogCoverVisual } from "@/components/blog/BlogCoverVisual";
import { BlogShareBar } from "@/components/blog/BlogShareBar";
import { BlogFAQSection } from "@/components/blog/BlogFAQSection";
import { AdBanner } from "@/components/ui/AdBanner";
import { Button } from "@/components/ui/Button";

interface BlogPostProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return routing.locales.flatMap((locale) =>
    posts.map((post) => ({ locale, slug: post.slug }))
  );
}

export async function generateMetadata({ params }: BlogPostProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug);

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
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(post.slug, post.category, 3);
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

  // FAQ Schema (if available)
  const faqSchema =
    post.faqs && post.faqs.length > 0 ? getFAQSchema(post.faqs) : null;

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
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

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

        {/* Reusable Visual Cover Box (Dynamic Branded Visual or User Image) */}
        <div className="mb-[40px] md:mb-[60px]">
          <BlogCoverVisual
            coverImage={post.cover_image}
            title={post.title}
            category={post.category}
            readTime={post.readTime}
            isLarge={true}
          />
        </div>

        {/* Markdown Content Section in Brand Card Box */}
        <div
          className="w-full bg-white rounded-[16px] md:rounded-[24px] border border-[#EAEAEA] p-[24px] md:p-[44px] shadow-[0px_4px_40px_rgba(0,0,0,0.04)] font-body text-[16px] md:text-[17px] leading-[1.8] text-[#374151] space-y-[22px]
          [&>h2]:font-heading [&>h2]:font-semibold [&>h2]:text-[22px] [&>h2]:md:text-[28px] [&>h2]:text-text-dark [&>h2]:mt-[40px] [&>h2]:mb-[16px] [&>h2]:tracking-[0.03em] [&>h2]:pb-[8px] [&>h2]:border-b [&>h2]:border-[#FAF6F3] first:[&>h2]:mt-0
          [&>h3]:font-heading [&>h3]:font-semibold [&>h3]:text-[18px] [&>h3]:md:text-[22px] [&>h3]:text-text-dark [&>h3]:mt-[28px] [&>h3]:mb-[12px] [&>h3]:tracking-[0.03em]
          [&>p]:mb-[20px] [&>p]:leading-[1.8]
          [&>ul]:list-disc [&>ul]:pl-[24px] [&>ul]:space-y-[8px] [&>ul]:mb-[20px]
          [&>ol]:list-decimal [&>ol]:pl-[24px] [&>ol]:space-y-[8px] [&>ol]:mb-[20px]
          [&>li]:leading-[1.7]
          [&>li>strong]:font-semibold [&>li>strong]:text-text-dark
          [&>p>strong]:font-semibold [&>p>strong]:text-text-dark
          [&_a]:text-brand-primary [&_a]:font-medium hover:[&_a]:underline
          [&>blockquote]:border-l-[4px] [&>blockquote]:border-brand-primary [&>blockquote]:pl-[18px] [&>blockquote]:italic [&>blockquote]:text-text-muted [&>blockquote]:my-[24px] [&>blockquote]:bg-[#FAF6F3] [&>blockquote]:p-[16px] [&>blockquote]:rounded-r-[10px]
          [&>code]:bg-[#FAF6F3] [&>code]:text-brand-primary [&>code]:px-[6px] [&>code]:py-[2px] [&>code]:rounded-[4px] [&>code]:text-[14px] [&>code]:font-mono
        "
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Dedicated Interactive FAQ Section */}
        {post.faqs && post.faqs.length > 0 && (
          <BlogFAQSection faqs={post.faqs} />
        )}

        {/* AdSense Unit */}
        <div className="my-[36px] md:my-[56px]">
          <AdBanner />
        </div>

        {/* High-Converting CTA Box (CrushSVG Brand Box) */}
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
            href="/"
            className="h-[44px] px-[24px] rounded-[8px] bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white text-[14px] md:text-[15px] font-heading font-medium hover:opacity-90 transition-opacity shrink-0 no-underline flex items-center justify-center"
          >
            Open Converter &rarr;
          </Link>
        </div>

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
