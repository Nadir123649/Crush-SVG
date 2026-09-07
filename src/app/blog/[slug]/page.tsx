import { notFound } from 'next/navigation';
import { getPostBySlug, getAllPosts } from '@/lib/blog';
import { constructMetadata, SITE_URL } from '@/lib/seo';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { Hero } from '@/components/sections/Hero';
import { Button } from '@/components/ui/Button';

interface BlogPostProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return constructMetadata({ title: 'Post Not Found', description: 'The article you are looking for does not exist.' });
  }
  return constructMetadata({
    title: `${post.title} – CrushSVG Blog`,
    description: post.description,
    canonicalPath: `/blog/${post.slug}`,
  });
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: BlogPostProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.date,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CrushSVG',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icon-512.png`,
      },
    },
  };

  return (
    <div className="w-full flex flex-col items-center md:pb-[60px] min-h-[60vh]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* Hero */}
      <Hero
        badge="CrushSVG Blog"
        title={
          <>
            <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">
              {post.title}
            </span>
          </>
        }
        subtitle={post.description}
        className="mb-[24px] md:mb-[40px]"
      />

      <div className="w-full max-w-[800px] flex flex-col gap-[32px] md:gap-[48px]">

        {/* Meta + Back bar */}
        <div
          className="w-full flex flex-wrap items-center justify-between gap-[12px] bg-white rounded-[12px] p-5 md:p-7 border border-[#F2EDE8]"
          style={{ boxShadow: '6px 1px 50px 0px rgba(0, 0, 0, 0.04)' }}
        >
          <div className="flex items-center gap-[12px] flex-wrap">
            <div
              style={{
                border: '1px solid transparent',
                background: 'linear-gradient(#FFFCFA, #FFFCFA) padding-box, linear-gradient(to right, #D94A1E, #FF9A3D) border-box',
              }}
              className="flex items-center gap-[6px] h-[24px] rounded-[30px] px-[12px]"
            >
              <div className="w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0" />
              <span className="font-body font-medium text-[12px] text-text-dark">{post.author}</span>
            </div>
            <time dateTime={post.date} className="font-afacad text-[14px] text-text-muted">
              {new Date(post.date).toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </time>
          </div>
          <Link
            href="/blog"
            className="font-afacad text-[14px] font-semibold text-brand-primary hover:underline transition-colors"
          >
            &larr; Back to Blog
          </Link>
        </div>

        {/* Article Content */}
        <section
          className="w-full flex flex-col bg-white rounded-[12px] p-[28px] md:p-[48px] border border-[#F2EDE8]"
          style={{ boxShadow: '6px 1px 50px 0px rgba(0, 0, 0, 0.04)' }}
        >
          <div className="
            prose prose-lg max-w-none
            prose-headings:font-heading prose-headings:text-text-dark prose-headings:font-semibold prose-headings:leading-snug
            prose-h2:text-[24px] prose-h2:md:text-[32px] prose-h2:mb-5 prose-h2:mt-10 first:prose-h2:mt-0
            prose-h3:text-[20px] prose-h3:md:text-[24px]
            prose-p:font-afacad prose-p:text-text-muted prose-p:leading-[1.7] prose-p:text-[17px] prose-p:md:text-[18px]
            prose-a:text-brand-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
            prose-strong:text-text-dark prose-strong:font-semibold
            prose-code:bg-[#F5F5F5] prose-code:text-brand-primary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[14px] prose-code:font-mono
            prose-pre:bg-[#1E1E1E] prose-pre:rounded-[12px] prose-pre:p-[24px] prose-pre:overflow-x-auto
            prose-blockquote:border-l-4 prose-blockquote:border-brand-primary prose-blockquote:text-text-muted prose-blockquote:pl-4 prose-blockquote:italic
            prose-li:font-afacad prose-li:text-text-muted prose-li:text-[17px] prose-li:md:text-[18px] prose-li:leading-[1.7]
            prose-hr:border-[#F2EDE8]
            prose-img:rounded-[12px]
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>
        </section>

        {/* Inline CTA callout — same as svg-guides */}
        <div className="p-5 md:p-6 rounded-[10px] bg-[#FCF1ED] border border-[#F2EDE8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-heading font-semibold text-text-dark text-base">Ready to convert your SVG to PNG?</p>
            <p className="font-afacad text-sm text-text-muted">Free, browser-based, pixel-perfect. No install needed.</p>
          </div>
          <Link
            href="/#converter"
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            Open Converter &rarr;
          </Link>
        </div>

        {/* Bottom nav banner */}
        <div className="w-full p-7 md:p-8 bg-[#FCF1ED] rounded-[12px] border border-[#F2EDE8] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h3 className="font-heading font-semibold text-xl text-text-dark mb-1">
              Explore more guides
            </h3>
            <p className="font-afacad text-sm text-text-muted">
              Learn SVG best practices, tips, and conversion guides.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button href="/blog" variant="outline" className="px-5 py-2.5 h-[40px] rounded-xl text-sm font-semibold border border-[#E5DFDA]">
              All Articles
            </Button>
            <Button href="/svg-guides" variant="solid" className="px-5 py-2.5 h-[40px] rounded-xl text-sm font-semibold">
              SVG Guides
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
