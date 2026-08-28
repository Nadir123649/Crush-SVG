import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import { constructMetadata } from '@/lib/seo';

export const metadata = constructMetadata({
  title: 'Blog & Articles - CrushSVG',
  description: 'Read the latest guides, tutorials, and tips about SVGs, image conversion, and web design.',
  canonicalPath: '/blog',
});

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 mt-16 md:mt-24">
      <div className="mb-12">
        <h1 className="text-4xl font-bold font-heading text-foreground mb-4">Blog & Guides</h1>
        <p className="text-lg text-muted-foreground">
          Discover the latest articles on SVG optimization, web design, and development.
        </p>
      </div>

      <div className="grid gap-8">
        {posts.map((post) => (
          <article key={post.slug} className="bg-card p-6 rounded-2xl border border-border shadow-sm transition-shadow hover:shadow-md">
            <Link href={`/blog/${post.slug}`}>
              <h2 className="text-2xl font-semibold font-heading mb-2 hover:text-brand-primary transition-colors">
                {post.title}
              </h2>
            </Link>
            <div className="flex items-center text-sm text-muted-foreground mb-4 space-x-4">
              <span>{new Date(post.date).toLocaleDateString()}</span>
              <span>•</span>
              <span>{post.author}</span>
            </div>
            <p className="text-foreground/80 line-clamp-3">
              {post.description}
            </p>
            <div className="mt-4">
              <Link href={`/blog/${post.slug}`} className="text-brand-primary font-medium hover:underline">
                Read More &rarr;
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
