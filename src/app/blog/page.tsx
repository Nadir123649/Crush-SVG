import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import { constructMetadata } from '@/lib/seo';
import { Hero } from '@/components/sections/Hero';
import { Button } from '@/components/ui/Button';

export const metadata = constructMetadata({
  title: 'Blog & Guides – CrushSVG',
  description: 'Read the latest tutorials, guides, and tips about SVG, PNG conversion, and web design from the CrushSVG team.',
  canonicalPath: '/blog',
});

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="w-full flex flex-col items-center md:pb-[60px] min-h-[60vh]">

      {/* Hero */}
      <Hero
        badge="From The CrushSVG Team"
        title={<>Blog &amp; <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">Guides</span></>}
        subtitle="Tutorials, tips, and deep dives on SVG, PNG conversion, web design, and everything in between."
        className="mb-[24px] md:mb-[40px]"
      />

      {/* Posts */}
      <div className="w-full max-w-[980px] flex flex-col gap-[20px] md:gap-[28px]">

        {posts.length === 0 ? (
          <div className="w-full flex flex-col bg-white rounded-[16px] p-[32px] md:p-[48px] border border-[#F2EDE8]" style={{ boxShadow: '6px 1px 50px 0px rgba(0, 0, 0, 0.04)' }}>
            <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6] text-center">
              No articles yet. Check back soon!
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <article
              key={post.slug}
              className="group w-full flex flex-col bg-white rounded-[12px] p-[24px] md:p-[36px] border border-[#F2EDE8] transition-colors hover:border-[#D94A1E]/40"
              style={{ boxShadow: '6px 1px 50px 0px rgba(0, 0, 0, 0.04)' }}
            >
              {/* Meta */}
              <div className="flex items-center gap-[12px] flex-wrap mb-[16px]">
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

              {/* Title */}
              <Link href={`/blog/${post.slug}`} className="w-fit max-w-full">
                <h2 className="font-heading font-semibold text-[24px] md:text-[30px] text-text-dark mb-[12px] group-hover:text-brand-primary transition-colors leading-[1.25]">
                  {post.title}
                </h2>
              </Link>

              {/* Description */}
              <p className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.65] mb-[24px] max-w-[760px]">
                {post.description}
              </p>

              {/* Read More */}
              <div className="flex">
                <Button href={`/blog/${post.slug}`} variant="outline" className="px-5 py-2.5 h-[40px] rounded-lg text-sm font-semibold border border-[#E5DFDA]">
                  Read Article <span aria-hidden="true">&rarr;</span>
                </Button>
              </div>
            </article>
          ))
        )}

        {/* Bottom CTA Banner */}
        <div className="w-full mt-4 p-8 bg-[#FCF1ED] rounded-[24px] border border-[#F2EDE8] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h3 className="font-heading font-semibold text-xl text-text-dark mb-1">
              Ready to convert your SVGs?
            </h3>
            <p className="font-afacad text-sm text-text-muted">
              Free, browser-based, and pixel-perfect. No install needed.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button href="/help" variant="outline" className="px-5 py-2.5 h-[40px] rounded-xl text-sm font-semibold border border-[#E5DFDA]">
              SVG Guides
            </Button>
            <Button href="/" variant="solid" className="px-5 py-2.5 h-[40px] rounded-xl text-sm font-semibold">
              Start Converting
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
