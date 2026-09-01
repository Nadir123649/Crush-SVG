import { getBlogBySlug } from '@/lib/content/blogs';
import { constructMetadata } from '@/lib/seo';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Metadata } from 'next';
import Image from 'next/image';

const MAIN_BLOG_SLUG = "svg-to-png-converter-email-marketer";

export const metadata: Metadata = constructMetadata({
  title: 'SVG to PNG Converter: The Tool Every Email Marketer Actually Needs - CrushSVG',
  description: 'Canva exports. Photoshop conversions. Screenshots and cropping. Watermarked online converters. Every workaround for broken email images, tried and rejected.',
  canonicalPath: '/blog',
});

export default function BlogPage() {
  const post = getBlogBySlug(MAIN_BLOG_SLUG);

  if (!post) {
    return <div className="text-center py-20">Blog post not found</div>;
  }

  return (
    <main className="w-full flex flex-col items-center min-h-screen bg-background">
      {/* Blog Article Container */}
      <article className="w-full max-w-[800px] px-[16px] md:px-[40px] py-[40px] md:py-[80px]">
        
        {/* Header Section */}
        <header className="flex flex-col gap-[16px] mb-[40px] md:mb-[60px] items-center text-center">
          <div 
            style={{ 
              border: "1px solid transparent",
              background: "linear-gradient(#FFFCFA, #FFFCFA) padding-box, linear-gradient(to right, #D94A1E, #FF9A3D) border-box"
            }}
            className="inline-flex items-center gap-[6px] md:gap-[10px] h-[24px] md:h-[29px] rounded-[30px] px-[12px] md:px-[16px] max-w-max"
          >
            <div className="relative flex w-[6px] h-[6px] shrink-0">
              <span className="animate-soft-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-80"></span>
              <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-brand-primary"></span>
            </div>
            <span className="font-body font-medium text-[12px] md:text-[14px] leading-[14px] md:leading-[18.67px] text-text-dark whitespace-nowrap">
              Featured Article
            </span>
          </div>

          <div className="flex items-center gap-[12px] font-body text-[14px] text-text-muted mt-[4px]">
            <span className="font-semibold text-brand-primary">{post.category}</span>
            <span className="w-[4px] h-[4px] rounded-full bg-[#D1D5DB]"></span>
            <span>{post.readTime}</span>
          </div>
          
          <h1 className="font-heading font-semibold text-[32px] md:text-[48px] leading-[1.2] tracking-[0.02em] text-text-dark max-w-[800px]">
            {post.title}
          </h1>
        </header>

        {/* Featured Image Placeholder */}
        <div className="w-full aspect-video rounded-[12px] md:rounded-[24px] bg-[#FCF1ED] flex items-center justify-center mb-[40px] md:mb-[60px] overflow-hidden relative">
          <Image 
            src="/blog.png" 
            alt="Blog Featured Image" 
            fill 
            className="object-cover"
            priority
          />
        </div>

        {/* Content Section with custom markdown styling */}
        <div className="w-full font-body text-[16px] md:text-[18px] leading-[1.8] text-text-body space-y-[24px]
          [&>h2]:font-heading [&>h2]:font-semibold [&>h2]:text-[24px] [&>h2]:md:text-[32px] [&>h2]:text-text-dark [&>h2]:mt-[48px] [&>h2]:mb-[16px]
          [&>h3]:font-heading [&>h3]:font-medium [&>h3]:text-[20px] [&>h3]:md:text-[24px] [&>h3]:text-text-dark [&>h3]:mt-[32px] [&>h3]:mb-[12px]
          [&>p]:mb-[24px]
          [&>ul]:list-disc [&>ul]:pl-[24px] [&>ul]:space-y-[8px] [&>ul]:mb-[24px]
          [&>ol]:list-decimal [&>ol]:pl-[24px] [&>ol]:space-y-[8px] [&>ol]:mb-[24px]
          [&>li>strong]:font-semibold [&>li>strong]:text-text-dark
          [&>p>strong]:font-semibold [&>p>strong]:text-text-dark
          [&>a]:text-brand-primary [&>a]:font-medium hover:[&>a]:underline
          [&>blockquote]:border-l-4 [&>blockquote]:border-brand-primary [&>blockquote]:pl-[16px] [&>blockquote]:italic [&>blockquote]:text-text-muted [&>blockquote]:my-[32px]
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
    </main>
  );
}
