import { NextRequest } from "next/server";
import { SITE_URL } from "@/lib/seo";
import { useCases } from "@/lib/data/use-cases";
import { getLocalizedHref, routing, type Locale } from "@/i18n/routing";
import { Blog, connectToDatabase } from "@/lib/database/db";
import { SITEMAP_GENERATED_AT, SITEMAP_STATIC_ROUTES } from "../sitemap-routes.generated";
import { serializeSitemap } from "@/lib/seo/sitemap-xml";
import {
  getSitemapLanguageAlternates,
  SITEMAP_INDEXABLE_STATIC_ROUTES,
} from "@/lib/seo/sitemap-routes";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BASE_URL = (SITE_URL || "https://www.crushsvg.net").replace(/\/$/, "");

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
  "/blog": { priority: 0.7, changeFrequency: "daily" },
  "/svg-guides": { priority: 0.7, changeFrequency: "weekly" },
  "/about": { priority: 0.5, changeFrequency: "monthly" },
  "/help": { priority: 0.5, changeFrequency: "monthly" },
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
  const languages = getSitemapLanguageAlternates(path, BASE_URL);

  return routing.locales.map((locale) => ({
    url: `${BASE_URL}${getLocalizedHref(path, locale as Locale)}`,
    alternates: { languages },
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
    if (!SITEMAP_INDEXABLE_STATIC_ROUTES.has(route) || isExcludedPath(route)) continue;
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
  } catch (error) {
    console.error("Could not load published blog posts for sitemap:", error);
  }

  for (const useCase of useCases) {
    entries.push(...localizedEntries(
      `/use-case/${encodeURIComponent(useCase.slug)}`,
      SITEMAP_GENERATED_AT,
      0.8,
      "monthly",
    ));
  }

  const uniqueEntries = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const entry of entries) {
    const url = new URL(entry.url);
    url.search = "";
    url.hash = "";
    if (url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }

    const normalizedUrl = url.toString();
    uniqueEntries.set(normalizedUrl, { ...entry, url: normalizedUrl });
  }

  return [...uniqueEntries.values()];
}

function buildNativeXmlViewerHtml(xml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>sitemap.xml</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background-color: #121212;
    color: #ffffff;
    min-height: 100vh;
    font-family: monospace;
  }
  .banner {
    font-family: "Times New Roman", Times, serif;
    font-size: 16px;
    color: #ffffff;
    padding: 6px 8px 6px 8px;
    line-height: 1.4;
  }
  .divider {
    height: 1px;
    background-color: #ffffff;
    width: 100%;
    margin: 0;
  }
  .tree {
    font-family: Consolas, Menlo, Monaco, "Courier New", monospace;
    font-size: 13px;
    line-height: 1.5;
    padding: 8px;
    white-space: pre;
    overflow-x: auto;
  }
  .node {
    margin: 0;
    line-height: 1.5;
  }
  .toggle {
    cursor: pointer;
    user-select: none;
    color: #4fa3d1;
    display: inline-block;
    margin-right: 1px;
  }
  .toggle:hover {
    opacity: 0.8;
  }
  .tag {
    color: #4fa3d1;
  }
  .attr-name {
    color: #4fa3d1;
  }
  .attr-val {
    color: #f29766;
  }
  .url-link {
    color: #4fa3d1;
    text-decoration: none;
  }
  .url-link:hover {
    text-decoration: underline;
  }
  .val {
    color: #ffffff;
    font-weight: normal;
  }
  .collapsed > .children,
  .collapsed > .close-tag {
    display: none;
  }
  .collapsed > .header .toggle::before {
    content: "\25B6";
  }
  .expanded > .header .toggle::before {
    content: "\25BC";
  }
</style>
</head>
<body>
<div class="banner">This XML file does not appear to have any style information associated with it. The document tree is shown below.</div>
<div class="divider"></div>
<div class="tree" id="tree"></div>

<script>
(function() {
  const xmlText = ${JSON.stringify(xml)};
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "application/xml");
  const treeEl = document.getElementById("tree");

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderNode(node, depth) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const container = document.createElement("div");
      container.className = "node expanded";
      const pad = "  ".repeat(depth);

      const hasElements = Array.from(node.childNodes).some(n => n.nodeType === Node.ELEMENT_NODE);
      const textOnly = !hasElements && node.textContent.trim().length > 0;

      let openTag = esc("<" + node.nodeName);
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        openTag += " " + '<span class="attr-name">' + esc(attr.name) + '</span>=<span class="attr-val">&quot;' + esc(attr.value) + '&quot;</span>';
      }

      if (!hasElements && !textOnly) {
        container.innerHTML = pad + '<span class="tag">' + openTag + ' /&gt;</span>';
        return container;
      }

      if (textOnly) {
        const textVal = esc(node.textContent.trim());
        const isUrl = textVal.startsWith("http://") || textVal.startsWith("https://");
        const valHtml = isUrl
          ? '<a class="url-link" href="' + textVal + '" target="_blank">' + textVal + '</a>'
          : '<span class="val">' + textVal + '</span>';

        container.innerHTML = pad + '<span class="tag">' + openTag + '&gt;</span>' +
          valHtml +
          '<span class="tag">&lt;/' + esc(node.nodeName) + '&gt;</span>';
        return container;
      }

      // Collapsible element with children
      const header = document.createElement("div");
      header.className = "header";

      const toggle = document.createElement("span");
      toggle.className = "toggle";

      header.appendChild(document.createTextNode(pad));
      header.appendChild(toggle);

      const openSpan = document.createElement("span");
      openSpan.className = "tag";
      openSpan.innerHTML = openTag + "&gt;";
      header.appendChild(openSpan);

      container.appendChild(header);

      const childrenDiv = document.createElement("div");
      childrenDiv.className = "children";
      for (let child of node.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          childrenDiv.appendChild(renderNode(child, depth + 1));
        }
      }
      container.appendChild(childrenDiv);

      const closeTag = document.createElement("div");
      closeTag.className = "close-tag";
      closeTag.innerHTML = pad + '<span class="tag">&lt;/' + esc(node.nodeName) + '&gt;</span>';
      container.appendChild(closeTag);

      toggle.addEventListener("click", function() {
        container.classList.toggle("collapsed");
        container.classList.toggle("expanded");
      });

      return container;
    }
    return document.createTextNode("");
  }

  if (xmlDoc.documentElement) {
    treeEl.appendChild(renderNode(xmlDoc.documentElement, 0));
  }
})();
</script>
</body>
</html>`;
}

export async function GET(request: NextRequest): Promise<Response> {
  const entries = await getSitemapEntries();
  const xml = serializeSitemap(entries);

  const url = request.nextUrl;
  const forceRaw = url.searchParams.get("raw") === "true" || url.searchParams.get("format") === "xml";
  const userAgent = (request.headers.get("user-agent") ?? "").toLowerCase();
  const isBot = /googlebot|bingbot|yandex|duckduckbot|slurp|baiduspider|curl|wget|python|axios/i.test(userAgent);
  const accept = request.headers.get("accept") ?? "";
  const acceptsXmlOnly = accept.includes("application/xml") && !accept.includes("text/html");

  // Crawlers and API clients get clean XML
  if (forceRaw || isBot || acceptsXmlOnly) {
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  }

  // Browsers get the exact native dark tree view
  return new Response(buildNativeXmlViewerHtml(xml), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}
