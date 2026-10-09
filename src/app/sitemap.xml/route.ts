import { SITE_URL } from "@/lib/seo";
import { useCases } from "@/lib/data/use-cases";
import { getLocalizedHref, routing, type Locale } from "@/i18n/routing";
import { Blog, connectToDatabase } from "@/lib/database/db";
import { SITEMAP_GENERATED_AT, SITEMAP_STATIC_ROUTES } from "../sitemap-routes.generated";
import { serializeSitemap } from "@/lib/seo/sitemap-xml";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BASE_URL = (SITE_URL || "https://www.crushsvg.net").replace(/\/$/, "");
const PRIORITY_BY_ROUTE: Record<string, number> = {
  "/": 1,
  "/blog": 0.8,
  "/use-case": 0.8,
  "/png-to-svg": 0.9,
  "/background-remover": 0.9,
  "/image-resizer": 0.9,
  "/svg-optimizer": 0.9,
  "/favicon-generator": 0.9,
  "/svg-to-react": 0.9,
};

function localizedEntries(
  path: string,
  lastModified: Date | string = SITEMAP_GENERATED_AT,
  priority = PRIORITY_BY_ROUTE[path] ?? 0.7,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly",
): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${BASE_URL}${getLocalizedHref(path, locale)}`;
  }
  languages["x-default"] = languages[routing.defaultLocale];

  return routing.locales.map((locale) => ({
    url: `${BASE_URL}${getLocalizedHref(path, locale as Locale)}`,
    lastModified,
    changeFrequency,
    priority: locale === routing.defaultLocale
      ? priority
      : Math.max(0.6, Number((priority - 0.1).toFixed(1))),
    alternates: { languages },
  }));
}

async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const route of SITEMAP_STATIC_ROUTES) {
    entries.push(
      ...localizedEntries(
        route,
        SITEMAP_GENERATED_AT,
        PRIORITY_BY_ROUTE[route],
        "monthly",
      ),
    );
  }

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
        "monthly",
      ),
    );
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
