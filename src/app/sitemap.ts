import { SITE_URL } from "@/lib/seo";
import { useCases } from "@/lib/data/use-cases";
import { getLocalizedHref, routing } from "@/i18n/routing";
import { Blog, connectToDatabase } from "@/lib/database/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: ChangeFrequency;
  priority: number;
  alternates: Record<string, string>;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "&#34;")
    .replace(/'/g, "'");
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addLocalizedEntries(
  path: string,
  changeFrequency: ChangeFrequency,
  priority: number,
  lastModified: Date = new Date()
): SitemapEntry[] {
  const baseUrl = (SITE_URL || "https://www.crushsvg.net").replace(/\/$/, "");
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${baseUrl}${getLocalizedHref(path, locale)}`;
  }
  languages["x-default"] = languages[routing.defaultLocale];

  const entries: SitemapEntry[] = [];
  for (const locale of routing.locales) {
    entries.push({
      url: languages[locale],
      lastModified,
      changeFrequency,
      priority: locale === routing.defaultLocale
        ? priority
        : Math.max(0.6, Number((priority - 0.1).toFixed(1))),
      alternates: { ...languages },
    });
  }
  return entries;
}

export default async function sitemap(): Promise<Response> {
  const allEntries: SitemapEntry[] = [];

  const coreConverters = [
    { path: "/", priority: 1.0, changeFrequency: "daily" as ChangeFrequency },
    { path: "/png-to-svg", priority: 0.9, changeFrequency: "weekly" as ChangeFrequency },
    { path: "/background-remover", priority: 0.9, changeFrequency: "weekly" as ChangeFrequency },
    { path: "/image-resizer", priority: 0.9, changeFrequency: "weekly" as ChangeFrequency },
    { path: "/svg-optimizer", priority: 0.9, changeFrequency: "weekly" as ChangeFrequency },
    { path: "/favicon-generator", priority: 0.9, changeFrequency: "weekly" as ChangeFrequency },
    { path: "/svg-to-react", priority: 0.9, changeFrequency: "weekly" as ChangeFrequency },
  ] as const;

  for (const page of coreConverters) {
    allEntries.push(...addLocalizedEntries(page.path, page.changeFrequency, page.priority));
  }

  const staticPages = [
    { path: "/about", priority: 0.8, changeFrequency: "weekly" as ChangeFrequency },
    { path: "/team", priority: 0.7, changeFrequency: "monthly" as ChangeFrequency },
    { path: "/changelog", priority: 0.7, changeFrequency: "weekly" as ChangeFrequency },
    { path: "/svg-guides", priority: 0.8, changeFrequency: "weekly" as ChangeFrequency },
    { path: "/contact-us", priority: 0.6, changeFrequency: "monthly" as ChangeFrequency },
    { path: "/help", priority: 0.6, changeFrequency: "monthly" as ChangeFrequency },
    { path: "/support", priority: 0.6, changeFrequency: "monthly" as ChangeFrequency },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" as ChangeFrequency },
    { path: "/use-case", priority: 0.8, changeFrequency: "weekly" as ChangeFrequency },
    { path: "/terms", priority: 0.4, changeFrequency: "yearly" as ChangeFrequency },
    { path: "/privacy-policy", priority: 0.4, changeFrequency: "yearly" as ChangeFrequency },
    { path: "/cookies", priority: 0.4, changeFrequency: "yearly" as ChangeFrequency },
  ] as const;

  for (const page of staticPages) {
    allEntries.push(...addLocalizedEntries(page.path, page.changeFrequency, page.priority));
  }

  await connectToDatabase();
  const posts = await Blog.find({ published: true })
    .select("slug updatedAt createdAt")
    .lean();

  for (const post of posts) {
    allEntries.push(
      ...addLocalizedEntries(
        `/blog/${encodeURIComponent(post.slug)}`,
        "weekly",
        0.7,
        post.updatedAt || post.createdAt || new Date()
      )
    );
  }

  for (const useCase of useCases) {
    allEntries.push(
      ...addLocalizedEntries(
        `/use-case/${encodeURIComponent(useCase.slug)}`,
        "weekly",
        0.8
      )
    );
  }

  // Build XML string manually with xhtml namespace and hreflang links
  const xmlParts: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];

  for (const entry of allEntries) {
    xmlParts.push("  <url>");
    xmlParts.push(`    <loc>${escapeXml(entry.url)}</loc>`);
    xmlParts.push(`    <lastmod>${formatDate(entry.lastModified)}</lastmod>`);
    xmlParts.push(`    <changefreq>${entry.changeFrequency}</changefreq>`);
    xmlParts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);

    // Add xhtml:link hreflang tags for all locales + x-default
    for (const [hreflang, href] of Object.entries(entry.alternates)) {
      xmlParts.push(
        `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXml(href)}"/>`
      );
    }

    xmlParts.push("  </url>");
  }

  xmlParts.push("</urlset>");

  const xml = xmlParts.join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}