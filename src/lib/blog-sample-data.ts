// TEST DATA - delete this file (plus public/sample-blog/ and the BLOG_SAMPLE_DATA
// blocks in the blog pages) once real articles are published from the admin.
import type { BlogPost } from "@/lib/blog";

// Opt-in only: set BLOG_SAMPLE_DATA=true to append sample posts.
export const BLOG_SAMPLE_DATA_ENABLED = process.env.BLOG_SAMPLE_DATA === "true";

const SAMPLES: { title: string; category: string }[] = [
  { title: "Fixing Broken SVG Images in Outlook", category: "Email Marketing" },
  { title: "Retina PNG Exports: A Practical Checklist", category: "Email Marketing" },
  { title: "Optimizing SVG Files for the Web", category: "SVG Tips" },
  { title: "Vectorizing Logos Without Losing Detail", category: "SVG Tips" },
  { title: "Choosing the Right Favicon Sizes", category: "Guides" },
  { title: "Batch Resizing Images the Easy Way", category: "Guides" },
];

export const SAMPLE_BLOG_POSTS: BlogPost[] = SAMPLES.map((s, i) => {
  const date = new Date(Date.UTC(2025, 0, 30 - i * 3));
  const title = `[SAMPLE] ${s.title}`;
  const content = `<p>This is placeholder test content for "${s.title}". It is not a real article.</p>`;
  return {
    slug: `sample-${i + 1}`,
    title,
    seo_title: title,
    seo_description: "Sample test article. Not real content.",
    description: "Sample test article. Not real content.",
    excerpt: "Sample test article used to preview the blog listing layout. Not real content.",
    date: date.toISOString(),
    formattedDate: date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    category: s.category,
    readTime: "1 min read",
    author: "Sample Data",
    cover_image: `/sample-blog/sample-${i + 1}.svg`,
    accent_color: "#FF6B00",
    content,
  };
});
