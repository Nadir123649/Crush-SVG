import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'src/content/blog');

export interface BlogFAQ {
  question: string;
  answer: string;
}

export interface BlogPost {
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
  faqs?: BlogFAQ[];
  content: string;
}

function calculateReadTime(text: string): string {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getPostSlugs(): string[] {
  if (!fs.existsSync(contentDirectory)) return [];
  return fs.readdirSync(contentDirectory).filter((file) => file.endsWith('.md'));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const realSlug = slug.replace(/\.md$/, '');
  const fullPath = path.join(contentDirectory, `${realSlug}.md`);

  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const title = data.title || 'Untitled';
  const seo_title = data.seo_title || `${title} | CrushSVG`;
  const description = data.description || data.seo_description || data.excerpt || '';
  const seo_description = data.seo_description || description;
  const date = data.date ? String(data.date) : new Date().toISOString().split('T')[0];
  const readTime = data.readTime || calculateReadTime(content);
  const excerpt = data.excerpt || description || content.slice(0, 160).replace(/[#*`_\[\]]/g, '').trim() + '...';

  return {
    slug: data.slug || realSlug,
    title,
    seo_title,
    seo_description,
    description,
    excerpt,
    date,
    formattedDate: formatDate(date),
    category: data.category || 'Email Marketing',
    readTime,
    author: data.author || 'CrushSVG Team',
    cover_image: data.cover_image || '/blog.png',
    accent_color: data.accent_color || '#FF6B00',
    faqs: Array.isArray(data.faqs) ? data.faqs : [],
    content,
  };
}

export function getAllPosts(): BlogPost[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    .filter((post): post is BlogPost => post !== null)
    .sort((post1, post2) => (new Date(post2.date).getTime() - new Date(post1.date).getTime()));
  return posts;
}

export function getFeaturedPost(): BlogPost | null {
  const posts = getAllPosts();
  return posts.length > 0 ? posts[0] : null;
}

export function getCategories(): string[] {
  const posts = getAllPosts();
  const categories = Array.from(new Set(posts.map((p) => p.category)));
  return ['All', ...categories];
}

export function getRelatedPosts(currentSlug: string, category?: string, limit = 3): BlogPost[] {
  const posts = getAllPosts().filter((p) => p.slug !== currentSlug);
  if (category) {
    const sameCategory = posts.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    if (sameCategory.length >= limit) {
      return sameCategory.slice(0, limit);
    }
    const otherPosts = posts.filter((p) => p.category.toLowerCase() !== category.toLowerCase());
    return [...sameCategory, ...otherPosts].slice(0, limit);
  }
  return posts.slice(0, limit);
}
