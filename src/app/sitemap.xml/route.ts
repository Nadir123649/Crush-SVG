import { SITE_URL } from "@/lib/seo";
import { useCases } from "@/lib/data/use-cases";
import { getLocalizedHref, routing, type Locale } from "@/i18n/routing";
import { Blog, connectToDatabase } from "@/lib/database/db";
import { SITEMAP_GENERATED_AT, SITEMAP_STATIC_ROUTES } from "../sitemap-routes.generated";
import { serializeSitemap } from "@/lib/seo/sitemap-xml";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BASE_URL = (SITE_URL || "https://crushsvg.net").replace(/\/$/, "");

interface RouteConfig {
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}

const ROUTE_CONFIG: Record<string, RouteConfig> = {
  "/": { priority: 1.0, changeFrequency: "weekly" },
  "/png-to-svg": { priority: 0.8, changeFrequency: "monthly" },
  "/background-remover": { priority: 0.8, changeFrequency: "monthly" },
  "/image-resizer": { priority: 0.8, changeFrequency: "monthly" },
  "/svg-optimizer": { priority: 0.8, changeFrequency: "monthly" },
  "/favicon-generator": { priority: 0.8, changeFrequency: "monthly" },
  "/svg-to-react": { priority: 0.8, changeFrequency: "monthly" },
  "/use-case": { priority: 0.8, changeFrequency: "monthly" },
  "/compare/crushsvg-vs-vectorizer-ai": { priority: 0.8, changeFrequency: "monthly" },
  "/compare/crushsvg-vs-adobe-illustrator-image-trace": { priority: 0.8, changeFrequency: "monthly" },
  "/blog": { priority: 0.7, changeFrequency: "daily" },
  "/svg-guides": { priority: 0.7, changeFrequency: "weekly" },
  "/about": { priority: 0.5, changeFrequency: "monthly" },
  "/contact-us": { priority: 0.5, changeFrequency: "monthly" },
  "/help": { priority: 0.5, changeFrequency: "monthly" },
  "/support": { priority: 0.5, changeFrequency: "monthly" },
  "/team": { priority: 0.5, changeFrequency: "monthly" },
  "/changelog": { priority: 0.5, changeFrequency: "monthly" },
  "/terms": { priority: 0.3, changeFrequency: "monthly" },
  "/privacy-policy": { priority: 0.3, changeFrequency: "monthly" },
  "/cookies": { priority: 0.3, changeFrequency: "monthly" },
};

const EXCLUDED_PATTERNS = [
  /^\/(login|signin|signup|register)($|\/)/i,
  /^\/(forgot-password|reset-password|verify-email|email-verification|verify)($|\/)/i,
  /^\/(dashboard|account|profile|settings)($|\/)/i,
  /^\/(billing|subscription|history|my-files)($|\/)/i,
  /^\/(404|500|checkout|cancel|thank-you|offline)($|\/)/i,
  /^\/(api|admin|webhooks)($|\/)/i,
  /^\/(convert-svg-to-png|svg-to-png)($|\/)/i,
];

function isExcludedPath(path: string): boolean {
  return EXCLUDED_PATTERNS.some((pattern) => pattern.test(path));
}

function localizedEntries(
  path: string,
  lastModified: Date | string = SITEMAP_GENERATED_AT,
  overridePriority?: number,
  overrideFreq?: MetadataRoute.Sitemap[number]["changeFrequency"],
): MetadataRoute.Sitemap {
  if (isExcludedPath(path)) {
    return [];
  }

  const config = ROUTE_CONFIG[path] || { priority: 0.7, changeFrequency: "monthly" };
  const basePriority = overridePriority ?? config.priority;
  const changeFreq = overrideFreq ?? config.changeFrequency;

  return routing.locales.map((locale) => ({
    url: `${BASE_URL}${getLocalizedHref(path, locale as Locale)}`,
    lastModified,
    changeFrequency: changeFreq,
    priority: locale === routing.defaultLocale
      ? basePriority
      : Math.max(0.5, Number((basePriority - 0.1).toFixed(1))),
  }));
}

async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const route of SITEMAP_STATIC_ROUTES) {
    if (isExcludedPath(route)) continue;
    entries.push(...localizedEntries(route, SITEMAP_GENERATED_AT));
  }

  try {
    await connectToDatabase();
    const posts = await Blog.find({ published: true })
      .select("slug updatedAt createdAt")
      .lean();

    for (const post of posts) {
      entries.push(
        ...localizedEntries(
          `/blog/${encodeURIComponent(post.slug)}`,
          post.updatedAt || post.createdAt || SITEMAP_GENERATED_AT,
          0.7,
          "weekly",
        ),
      );
    }
  } catch {
    // Graceful fallback if database connection is unavailable
  }

  for (const useCase of useCases) {
    entries.push(...localizedEntries(
      `/use-case/${encodeURIComponent(useCase.slug)}`,
      SITEMAP_GENERATED_AT,
      0.8,
      "monthly",
    ));
  }

  return [...new Map(entries.map((entry) => [entry.url, entry])).values()];
}

export async function GET(): Promise<Response> {
  const xml = serializeSitemap(await getSitemapEntries());
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
