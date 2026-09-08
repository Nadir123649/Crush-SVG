import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { useCases } from "@/lib/data/use-cases";
import { getAllPosts } from "@/lib/blog";
import { routing, type Locale } from "@/i18n/routing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL || "https://www.crushsvg.net";
  const currentDate = new Date().toISOString().split("T")[0];

  // Build localized sitemap entries for all core pathnames defined in routing
  const localizedUrls: MetadataRoute.Sitemap = [];

  const localizedPathConfigs = [
    { key: "/", priority: 1.0, freq: "daily" as const },
    { key: "/convert-svg-to-png", priority: 1.0, freq: "daily" as const },
    { key: "/png-to-svg", priority: 0.9, freq: "weekly" as const },
    { key: "/background-remover", priority: 0.9, freq: "weekly" as const },
    { key: "/image-resizer", priority: 0.9, freq: "weekly" as const },
  ];

  for (const config of localizedPathConfigs) {
    const rawPath = routing.pathnames[config.key as keyof typeof routing.pathnames];

    // Build the language map for this route (all 6 locales + x-default)
    const languageMap: Record<string, string> = {};
    for (const locale of routing.locales) {
      if (typeof rawPath === "string") {
        languageMap[locale] = locale === "en" ? `${baseUrl}` : `${baseUrl}/${locale}`;
      } else {
        const subPath = (rawPath as Record<Locale, string>)[locale];
        languageMap[locale] = locale === "en" ? `${baseUrl}${subPath}` : `${baseUrl}/${locale}${subPath}`;
      }
    }
    languageMap["x-default"] = languageMap["en"];

    // Emit a sitemap entry for each locale variant
    for (const locale of routing.locales) {
      localizedUrls.push({
        url: languageMap[locale],
        lastModified: currentDate,
        changeFrequency: config.freq,
        priority: locale === "en" ? config.priority : Math.max(0.7, Number((config.priority - 0.1).toFixed(1))),
        alternates: {
          languages: languageMap,
        },
      });
    }
  }

  const staticRoutes = [
    { path: "/about", priority: 0.8, freq: "weekly" as const },
    { path: "/team", priority: 0.7, freq: "monthly" as const },
    { path: "/changelog", priority: 0.7, freq: "weekly" as const },
    { path: "/svg-guides", priority: 0.8, freq: "weekly" as const },
    { path: "/contact-us", priority: 0.6, freq: "monthly" as const },
    { path: "/help", priority: 0.6, freq: "monthly" as const },
    { path: "/support", priority: 0.6, freq: "monthly" as const },
    { path: "/terms", priority: 0.4, freq: "yearly" as const },
    { path: "/privacy-policy", priority: 0.4, freq: "yearly" as const },
    { path: "/cookies", priority: 0.4, freq: "yearly" as const },
  ];

  const staticUrls: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: currentDate,
    changeFrequency: route.freq,
    priority: route.priority,
  }));

  const posts = getAllPosts();
  const blogUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.date ? post.date.split("T")[0] : currentDate,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const useCaseUrls: MetadataRoute.Sitemap = useCases.map((uc) => ({
    url: `${baseUrl}/use-case/${uc.slug}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...localizedUrls, ...staticUrls, ...blogUrls, ...useCaseUrls];
}
