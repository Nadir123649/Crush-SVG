import { notFound } from 'next/navigation';
import { getPostBySlug, getAllPosts } from '@/lib/blog';
import { constructMetadata } from '@/lib/seo';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

interface BlogPostProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: BlogPostProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return constructMetadata({
      title: 'Post Not Found',
      description: 'The article you are looking for does not exist.',
    });
  }

  return constructMetadata({
    title: `${post.title} - CrushSVG Blog`,
    description: post.description,
    canonicalPath: `/blog/${post.slug}`,
  });
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: BlogPostProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="w-full max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8 mt-16 md:mt-24">
      <Link href="/blog" className="text-brand-primary hover:underline mb-8 inline-block">
        &larr; Back to Blog
      </Link>
      
      <article className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-heading prose-a:text-brand-primary">
        <header className="mb-12 not-prose">
          <h1 className="text-4xl sm:text-5xl font-bold font-heading text-foreground mb-6">
            {post.title}
          </h1>
          <div className="flex items-center text-muted-foreground space-x-4">
            <span>By {post.author}</span>
            <span>•</span>
            <time dateTime={post.date}>{new Date(post.date).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</time>
          </div>
        </header>

        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>
      </article>
    </main>
  );
}
