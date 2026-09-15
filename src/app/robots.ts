import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL || "https://www.crushsvg.net";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/v1/admin/"],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "anthropic-ai",
          "Google-Extended",
          "Applebot-Extended",
          "CCBot",
          "Cohere-ai",
          "Bytespider",
        ],
        allow: "/",
        disallow: ["/admin/", "/api/v1/admin/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

