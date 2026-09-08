import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { useCases } from "@/lib/data/use-cases";
import { getAllPosts } from "@/lib/blog";
import { routing, type Locale } from "@/i18n/routing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL || "https://www.crushsvg.net";
  const currentDate = new Date().toISOString().split("T")[0];

  function createLocalizedEntries({
    path,
    priority,
    changeFrequency,
    lastModified = currentDate,
    localizedSubpaths,
  }: {
    path: string;
    priority: number;
    changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
    lastModified?: string;
    localizedSubpaths?: Record<Locale, string>;
  }): MetadataRoute.Sitemap {
    const languageMap: Record<string, string> = {};
    for (const locale of routing.locales) {
      if (localizedSubpaths) {
        const subPath = localizedSubpaths[locale];
        languageMap[locale] = locale === "en" ? `${baseUrl}${subPath}` : `${baseUrl}/${locale}${subPath}`;
      } else {
        const cleanPath = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
        languageMap[locale] = locale === "en" ? `${baseUrl}${cleanPath}` : `${baseUrl}/${locale}${cleanPath}`;
      }
    }
    languageMap["x-default"] = languageMap["en"];

    return routing.locales.map((locale) => ({
      url: languageMap[locale],
      lastModified,
      changeFrequency,
      priority: locale === "en" ? priority : Math.max(0.6, Number((priority - 0.1).toFixed(1))),
      alternates: {
        languages: languageMap,
      },
    }));
  }

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // 1. Homepage & Core Localized Converters
  const coreConverters = [
    { key: "/", priority: 1.0, freq: "daily" as const },
    { key: "/convert-svg-to-png", priority: 1.0, freq: "daily" as const },
    { key: "/png-to-svg", priority: 0.9, freq: "weekly" as const },
    { key: "/background-remover", priority: 0.9, freq: "weekly" as const },
    { key: "/image-resizer", priority: 0.9, freq: "weekly" as const },
  ];

  for (const config of coreConverters) {
    const rawPath = routing.pathnames[config.key as keyof typeof routing.pathnames];
    const localizedSubpaths = typeof rawPath === "object" ? (rawPath as Record<Locale, string>) : undefined;

    sitemapEntries.push(
      ...createLocalizedEntries({
        path: config.key,
        priority: config.priority,
        changeFrequency: config.freq,
        localizedSubpaths,
      })
    );
  }

  // 2. Static Content Pages
  const staticPages = [
    { path: "/about", priority: 0.8, freq: "weekly" as const },
    { path: "/team", priority: 0.7, freq: "monthly" as const },
    { path: "/changelog", priority: 0.7, freq: "weekly" as const },
    { path: "/svg-guides", priority: 0.8, freq: "weekly" as const },
    { path: "/contact-us", priority: 0.6, freq: "monthly" as const },
    { path: "/help", priority: 0.6, freq: "monthly" as const },
    { path: "/support", priority: 0.6, freq: "monthly" as const },
    { path: "/blog", priority: 0.8, freq: "weekly" as const },
    { path: "/terms", priority: 0.4, freq: "yearly" as const },
    { path: "/privacy-policy", priority: 0.4, freq: "yearly" as const },
    { path: "/cookies", priority: 0.4, freq: "yearly" as const },
  ];

  for (const page of staticPages) {
    sitemapEntries.push(
      ...createLocalizedEntries({
        path: page.path,
        priority: page.priority,
        changeFrequency: page.freq,
      })
    );
  }

  // 3. Dynamic Blog Articles
  const posts = getAllPosts();
  for (const post of posts) {
    const postDate = post.date ? post.date.split("T")[0] : currentDate;
    sitemapEntries.push(
      ...createLocalizedEntries({
        path: `/blog/${post.slug}`,
        priority: 0.7,
        changeFrequency: "weekly",
        lastModified: postDate,
      })
    );
  }

  // 4. Dynamic Use Case Landing Pages
  for (const uc of useCases) {
    sitemapEntries.push(
      ...createLocalizedEntries({
        path: `/use-case/${uc.slug}`,
        priority: 0.8,
        changeFrequency: "weekly",
      })
    );
  }

  return sitemapEntries;
}
